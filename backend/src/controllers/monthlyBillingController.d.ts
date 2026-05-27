import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware.js";
export declare const createMonthlyBill: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const generateBulkMonthlyBills: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMonthlyBill: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getRenterMonthlyBills: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAllMonthlyBills: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateMonthlyBill: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteMonthlyBill: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const verifyMonthlyPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getRenterDashboardData: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAdminBillingStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getRoomBillingHistory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const syncAllRenterOverdueStatuses: () => Promise<void>;
export declare const sendMonthlyInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requestStayRenewal: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const triggerMonthlyReminders: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const sendRenterReminder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requestRenterCheckout: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const rejectRenterCheckout: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * RENTER: Request to Continue Stay
 * When monthly cycle expires, renter can request to continue
 * Creates StayRenewalRequest with CONTINUE_STAY type
 */
export declare const requestContinueStay: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * RENTER: Request Checkout
 */
export declare const requestCheckout: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * ADMIN: Get Pending Renewal/Checkout Requests
 */
export declare const getPendingRenewalRequests: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * ADMIN: Approve Continue Stay Request
 * Generates next month bill with rent + electricity + pending dues + penalties
 */
export declare const approveContinueStay: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * ADMIN: Reject Continue Stay Request
 */
export declare const rejectContinueStay: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * ADMIN: Approve Checkout Request
 * Completes booking and releases room
 */
export declare const approveCheckout: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * ADMIN: Reject Checkout Request
 * (Renter must continue stay)
 */
export declare const rejectCheckout: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=monthlyBillingController.d.ts.map