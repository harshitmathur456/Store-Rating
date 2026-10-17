import prisma from '../../lib/db.js';

function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

export class OwnerService {
  async getDashboard(userId: string) {
    const store = await prisma.store.findFirst({
      where: { ownerId: userId },
      select: { id: true, name: true, email: true, address: true },
    });

    if (!store) {
      return { store: null, avgRating: null, ratingCount: 0 };
    }

    const result = await prisma.$queryRawUnsafe<any[]>(
      `SELECT ROUND(AVG(r.rating)::numeric, 1) as "avgRating",
              COUNT(r.id)::int as "ratingCount"
       FROM ratings r
       WHERE r.store_id = $1::uuid`,
      store.id
    );

    return {
      store,
      avgRating: result[0].avgRating ? Number(result[0].avgRating) : null,
      ratingCount: Number(result[0].ratingCount),
    };
  }

  async getRaters(
    userId: string,
    filters: {
      sortBy: string;
      order: 'asc' | 'desc';
      page: number;
      pageSize: number;
    }
  ) {
    const store = await prisma.store.findFirst({
      where: { ownerId: userId },
    });

    if (!store) {
      return { data: [], meta: { page: 1, pageSize: filters.pageSize, total: 0 } };
    }

    // Allow-list sort fields
    const sortMap: Record<string, string> = {
      name: 'u.name',
      rating: 'r.rating',
      date: 'r.created_at',
    };
    const sortCol = sortMap[filters.sortBy] || 'r.created_at';
    const orderDir = filters.order === 'desc' ? 'DESC' : 'ASC';

    const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) as count FROM ratings r WHERE r.store_id = $1::uuid`,
      store.id
    );
    const total = Number(countResult[0].count);

    const offset = (filters.page - 1) * filters.pageSize;

    const data = await prisma.$queryRawUnsafe<any[]>(
      `SELECT u.name, u.email, r.rating, r.created_at as "createdAt"
       FROM ratings r
       JOIN users u ON u.id = r.user_id
       WHERE r.store_id = $1::uuid
       ORDER BY ${sortCol} ${orderDir}
       LIMIT $2 OFFSET $3`,
      store.id,
      filters.pageSize,
      offset
    );

    return {
      data: data.map((d) => ({
        ...d,
        rating: Number(d.rating),
      })),
      meta: { page: filters.page, pageSize: filters.pageSize, total },
    };
  }
}
