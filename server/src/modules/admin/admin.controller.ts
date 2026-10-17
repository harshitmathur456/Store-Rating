import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service.js';

const adminService = new AdminService();

export class AdminController {
  async dashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getDashboard();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getUsers(req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await adminService.createUser(req.body);
      res.status(201).json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await adminService.getUserById(req.params.id as string);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  }

  async getStores(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getStores(req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async createStore(req: Request, res: Response, next: NextFunction) {
    try {
      const store = await adminService.createStore(req.body);
      res.status(201).json({ data: store });
    } catch (err) {
      next(err);
    }
  }

  async getAvailableOwners(_req: Request, res: Response, next: NextFunction) {
    try {
      const owners = await adminService.getAvailableOwners();
      res.json({ data: owners });
    } catch (err) {
      next(err);
    }
  }
}
