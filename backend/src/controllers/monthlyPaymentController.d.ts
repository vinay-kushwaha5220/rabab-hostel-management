import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
export declare const processMonthlyPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPaymentHistory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllPayments: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPaymentStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createRazorpayOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const verifyRazorpayPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=monthlyPaymentController.d.ts.map