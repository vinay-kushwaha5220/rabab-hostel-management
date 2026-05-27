import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./authMiddleware.js";
export declare const adminOnly: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=adminMiddleware.d.ts.map