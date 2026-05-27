export interface RoomPricingInput {
    dailyPrice: number;
    monthlyPrice: number;
    price: number;
}
export interface PricingInput {
    room: RoomPricingInput;
    stayType: "DAILY" | "MONTHLY";
    duration: number;
    extraCharges?: number;
    electricityCharges?: number;
}
export interface PricingResult {
    roomRent: number;
    deposit: number;
    extraCharges: number;
    electricity: number;
    tax: number;
    subtotal: number;
    grandTotal: number;
    recurringMonthlyAmount: number;
}
export declare function calculateBookingPrice(input: PricingInput): PricingResult;
//# sourceMappingURL=pricingEngine.d.ts.map