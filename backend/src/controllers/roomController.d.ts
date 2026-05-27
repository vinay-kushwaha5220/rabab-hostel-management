import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
export declare const createRoom: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getRooms: (req: Request, res: Response) => Promise<void>;
export declare const getSingleRoom: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateRoom: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteRoom: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=roomController.d.ts.map