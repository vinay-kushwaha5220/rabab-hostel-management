export function calculateBookingPrice(input) {
    const isMonthly = input.stayType === "MONTHLY";
    const rentRate = isMonthly
        ? (input.room.monthlyPrice || input.room.price * 30)
        : (input.room.dailyPrice || input.room.price);
    const roomRent = Math.round(rentRate * input.duration);
    const deposit = isMonthly ? 2500 : 0;
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
//# sourceMappingURL=pricingEngine.js.map