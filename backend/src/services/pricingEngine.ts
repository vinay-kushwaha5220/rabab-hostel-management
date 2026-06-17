export interface RoomPricingInput {
  dailyPrice: number;
  monthlyPrice: number;
  price: number;
}

export interface PricingInput {
  room: RoomPricingInput;
  stayType: "DAILY" | "MONTHLY";
  duration: number; // Days for DAILY, months for MONTHLY
  extraCharges?: number;
  electricityCharges?: number;
  securityAmount?: number | undefined;
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

export function calculateBookingPrice(input: PricingInput): PricingResult {
  const isMonthly = input.stayType === "MONTHLY";
  const rentRate = isMonthly 
    ? (input.room.monthlyPrice || input.room.price * 30) 
    : (input.room.dailyPrice || input.room.price);

  const roomRent = Math.round(rentRate * input.duration);
  const deposit = input.securityAmount !== undefined ? input.securityAmount : 0;
  const extraCharges = input.extraCharges || 0;
  const electricity = input.electricityCharges || 0;

  // Enforcing no tax/GST system completely (GST/tax is always 0)
  const tax = 0;
  const subtotal = roomRent + extraCharges;
  const grandTotal = subtotal + deposit + tax;

  // Forecast for subsequent monthly periods (excluding initial deposit and taxes)
  const recurringMonthlyAmount = isMonthly 
    ? (input.room.monthlyPrice || input.room.price * 30) + electricity + extraCharges 
    : 0;

  return {
    roomRent,
    deposit,
    extraCharges,
    electricity,
    tax,
    subtotal,
    grandTotal,
    recurringMonthlyAmount
  };
}
