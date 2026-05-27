import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
export declare const getDashboardStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getNotifications: (req: AuthRequest, res: Response) => Promise<void>;
export declare const markNotificationRead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const markAllNotificationsRead: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=dashboardController.d.ts.map