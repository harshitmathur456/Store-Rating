import { Request, Response, NextFunction } from 'express';
import { StoreService } from './stores.service.js';

const storeService = new StoreService();

export class StoreController {
  async getStores(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await storeService.getStores(req.user!.id, req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async upsertRating(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await storeService.upsertRating(
        req.user!.id,
        req.params.storeId as string,
        req.body.rating
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
}
