import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
export declare const getAllElectricityBills: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getElectricityBillsByRoom: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createElectricityBill: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateElectricityBill: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteElectricityBill: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPendingBillsSummary: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=electricityController.d.ts.map