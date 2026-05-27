import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
export declare const sendMessage: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getConversation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUnreadCount: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllConversations: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=messagingController.d.ts.map