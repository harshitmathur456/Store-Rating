import prisma from '../../lib/db.js';
import { Prisma } from '@prisma/client';

function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

export class StoreService {
  async getStores(
    userId: string,
    filters: {
      name?: string;
      address?: string;
      sortBy: string;
      order: 'asc' | 'desc';
      page: number;
      pageSize: number;
    }
  ) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (filters.name) {
      conditions.push(`s.name ILIKE '%' || $${paramIdx} || '%'`);
      params.push(escapeLike(filters.name));
      paramIdx++;
    }
    if (filters.address) {
      conditions.push(`s.address ILIKE '%' || $${paramIdx} || '%'`);
      params.push(escapeLike(filters.address));
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Allow-list sort fields
    const sortMap: Record<string, string> = {
      name: 's.name',
      avgRating: '"avgRating"',
    };
    const sortCol = sortMap[filters.sortBy] || 's.name';
    const orderDir = filters.order === 'desc' ? 'DESC' : 'ASC';
    const nullsPos = filters.order === 'desc' ? 'NULLS LAST' : 'NULLS FIRST';

    // Count
    const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) as count FROM stores s ${whereClause}`,
      ...params
    );
    const total = Number(countResult[0].count);

    const offset = (filters.page - 1) * filters.pageSize;

    // Use parameterized userId for myRating subquery
    const userIdParamIdx = paramIdx;
    params.push(userId);
    const limitParamIdx = paramIdx + 1;
    params.push(filters.pageSize);
    const offsetParamIdx = paramIdx + 2;
    params.push(offset);

    const data = await prisma.$queryRawUnsafe<any[]>(
      `SELECT s.id, s.name, s.email, s.address,
              ROUND(AVG(r.rating)::numeric, 1) as "avgRating",
              COUNT(r.id)::int as "ratingCount",
              MAX(CASE WHEN r.user_id = $${userIdParamIdx}::uuid THEN r.rating ELSE NULL END)::int as "myRating"
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       ${whereClause}
       GROUP BY s.id
       ORDER BY ${sortCol === '"avgRating"' ? `"avgRating" ${orderDir} ${nullsPos}` : `${sortCol} ${orderDir}`}
       LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
      ...params
    );

    return {
      data: data.map((s) => ({
        ...s,
        avgRating: s.avgRating ? Number(s.avgRating) : null,
        ratingCount: Number(s.ratingCount),
        myRating: s.myRating ? Number(s.myRating) : null,
      })),
      meta: { page: filters.page, pageSize: filters.pageSize, total },
    };
  }

  async upsertRating(userId: string, storeId: string, rating: number) {
    // Verify store exists
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      const { ApiError } = await import('../../middleware/errorHandler.js');
      throw new ApiError(404, 'Store not found.', 'NOT_FOUND');
    }

    // Upsert on unique (userId, storeId)
    await prisma.rating.upsert({
      where: {
        userId_storeId: { userId, storeId },
      },
      create: {
        userId,
        storeId,
        rating,
      },
      update: {
        rating,
      },
    });

    // Return updated store summary
    const result = await prisma.$queryRawUnsafe<any[]>(
      `SELECT ROUND(AVG(r.rating)::numeric, 1) as "avgRating",
              COUNT(r.id)::int as "ratingCount"
       FROM ratings r
       WHERE r.store_id = $1::uuid`,
      storeId
    );

    return {
      storeId,
      avgRating: result[0].avgRating ? Number(result[0].avgRating) : null,
      ratingCount: Number(result[0].ratingCount),
      myRating: rating,
    };
  }
}
