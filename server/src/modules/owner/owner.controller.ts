import { Request, Response, NextFunction } from 'express';
import { OwnerService } from './owner.service.js';

const ownerService = new OwnerService();

export class OwnerController {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ownerService.getDashboard(req.user!.id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async getRaters(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ownerService.getRaters(req.user!.id, req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
