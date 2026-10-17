import prisma from '../../lib/db.js';
import { hashPassword } from '../../lib/password.js';
import { ApiError } from '../../middleware/errorHandler.js';
import { Prisma } from '@prisma/client';

// Escape LIKE wildcards to prevent expensive scans
function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

export class AdminService {
  async getDashboard() {
    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.rating.count(),
    ]);
    return { totalUsers, totalStores, totalRatings };
  }

  async getUsers(filters: {
    name?: string;
    email?: string;
    address?: string;
    role?: string;
    sortBy: string;
    order: 'asc' | 'desc';
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.UserWhereInput = {};

    if (filters.name) {
      where.name = { contains: escapeLike(filters.name), mode: 'insensitive' };
    }
    if (filters.email) {
      where.email = { contains: escapeLike(filters.email), mode: 'insensitive' };
    }
    if (filters.address) {
      where.address = { contains: escapeLike(filters.address), mode: 'insensitive' };
    }
    if (filters.role) {
      where.role = filters.role as any;
    }

    const allowedSortFields: Record<string, string> = {
      name: 'name',
      email: 'email',
      address: 'address',
      role: 'role',
    };

    const sortField = allowedSortFields[filters.sortBy] || 'name';

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          role: true,
          createdAt: true,
        },
        orderBy: { [sortField]: filters.order },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { page: filters.page, pageSize: filters.pageSize, total },
    };
  }

  async createUser(input: {
    name: string;
    email: string;
    password: string;
    address: string;
    role: string;
  }) {
    const existing = await prisma.user.findFirst({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ApiError(409, 'An account with this email already exists.', 'CONFLICT', [
        { field: 'email', message: 'An account with this email already exists.' },
      ]);
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        address: input.address,
        role: input.role as any,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true,
        ownedStore: {
          select: {
            id: true,
            name: true,
            ratings: { select: { rating: true } },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found.', 'NOT_FOUND');
    }

    let storeRating: number | null = null;
    let storeName: string | null = null;

    if (user.role === 'OWNER' && user.ownedStore) {
      storeName = user.ownedStore.name;
      if (user.ownedStore.ratings.length > 0) {
        const sum = user.ownedStore.ratings.reduce((a, r) => a + r.rating, 0);
        storeRating = Math.round((sum / user.ownedStore.ratings.length) * 10) / 10;
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      storeRating: user.role === 'OWNER'
        ? user.ownedStore
          ? storeRating !== null ? storeRating : 'No ratings yet'
          : 'No store assigned'
        : undefined,
      storeName: user.role === 'OWNER' ? storeName : undefined,
    };
  }

  async getStores(filters: {
    name?: string;
    email?: string;
    address?: string;
    sortBy: string;
    order: 'asc' | 'desc';
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.StoreWhereInput = {};

    if (filters.name) {
      where.name = { contains: escapeLike(filters.name), mode: 'insensitive' };
    }
    if (filters.email) {
      where.email = { contains: escapeLike(filters.email), mode: 'insensitive' };
    }
    if (filters.address) {
      where.address = { contains: escapeLike(filters.address), mode: 'insensitive' };
    }

    // For sorting by rating we need raw query; for others use Prisma
    if (filters.sortBy === 'rating') {
      // Use raw query for rating sort
      const nameFilter = filters.name ? `AND s.name ILIKE '%' || $1 || '%'` : '';
      const emailFilter = filters.email ? `AND s.email ILIKE '%' || $2 || '%'` : '';
      const addressFilter = filters.address ? `AND s.address ILIKE '%' || $3 || '%'` : '';

      const params: string[] = [];
      let paramIdx = 1;
      const conditions: string[] = [];

      if (filters.name) {
        conditions.push(`s.name ILIKE '%' || $${paramIdx} || '%'`);
        params.push(escapeLike(filters.name));
        paramIdx++;
      }
      if (filters.email) {
        conditions.push(`s.email ILIKE '%' || $${paramIdx} || '%'`);
        params.push(escapeLike(filters.email));
        paramIdx++;
      }
      if (filters.address) {
        conditions.push(`s.address ILIKE '%' || $${paramIdx} || '%'`);
        params.push(escapeLike(filters.address));
        paramIdx++;
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
      const orderDir = filters.order === 'desc' ? 'DESC' : 'ASC';
      const nullsPosition = filters.order === 'desc' ? 'NULLS LAST' : 'NULLS FIRST';

      const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM stores s ${whereClause}`,
        ...params
      );
      const total = Number(countResult[0].count);

      const offset = (filters.page - 1) * filters.pageSize;

      const data = await prisma.$queryRawUnsafe<any[]>(
        `SELECT s.id, s.name, s.email, s.address, s.owner_id as "ownerId",
                s.created_at as "createdAt",
                ROUND(AVG(r.rating)::numeric, 1) as "avgRating",
                COUNT(r.id)::int as "ratingCount"
         FROM stores s
         LEFT JOIN ratings r ON r.store_id = s.id
         ${whereClause}
         GROUP BY s.id
         ORDER BY "avgRating" ${orderDir} ${nullsPosition}
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        ...params,
        filters.pageSize,
        offset
      );

      return {
        data: data.map((s) => ({
          ...s,
          avgRating: s.avgRating ? Number(s.avgRating) : null,
          ratingCount: Number(s.ratingCount),
        })),
        meta: { page: filters.page, pageSize: filters.pageSize, total },
      };
    }

    const allowedSortFields: Record<string, string> = {
      name: 'name',
      email: 'email',
      address: 'address',
    };

    const sortField = allowedSortFields[filters.sortBy] || 'name';

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        include: {
          ratings: { select: { rating: true } },
        },
        orderBy: { [sortField]: filters.order },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.store.count({ where }),
    ]);

    const data = stores.map((s) => {
      const ratingCount = s.ratings.length;
      const avgRating =
        ratingCount > 0
          ? Math.round(
              (s.ratings.reduce((a, r) => a + r.rating, 0) / ratingCount) * 10
            ) / 10
          : null;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        address: s.address,
        ownerId: s.ownerId,
        createdAt: s.createdAt,
        avgRating,
        ratingCount,
      };
    });

    return {
      data,
      meta: { page: filters.page, pageSize: filters.pageSize, total },
    };
  }

  async createStore(input: {
    name: string;
    email: string;
    address: string;
    ownerId?: string | null;
  }) {
    // Check email uniqueness
    const existing = await prisma.store.findFirst({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ApiError(409, 'A store with this email already exists.', 'CONFLICT', [
        { field: 'email', message: 'A store with this email already exists.' },
      ]);
    }

    // Validate owner if provided
    if (input.ownerId) {
      const owner = await prisma.user.findUnique({
        where: { id: input.ownerId },
        include: { ownedStore: true },
      });

      if (!owner) {
        throw new ApiError(400, 'Owner not found.', 'VALIDATION_ERROR');
      }
      if (owner.role !== 'OWNER') {
        throw new ApiError(400, 'Selected user is not a Store Owner.', 'VALIDATION_ERROR');
      }
      if (owner.ownedStore) {
        throw new ApiError(400, 'This owner already has a store assigned.', 'VALIDATION_ERROR');
      }
    }

    const store = await prisma.store.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        address: input.address,
        ownerId: input.ownerId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        ownerId: true,
        createdAt: true,
      },
    });

    return store;
  }

  async getAvailableOwners() {
    const owners = await prisma.user.findMany({
      where: {
        role: 'OWNER',
        ownedStore: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return owners;
  }
}
