export function generateBookingId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RIAM-${timestamp}-${random}`;
}

export function calculateTotalAmount(
  hourlyPrices: Array<{ hour: number; price: number }>,
  selectedHours: number[]
): number {
  return selectedHours.reduce((total, hour) => {
    const price = hourlyPrices.find(p => p.hour === hour)?.price || 0;
    return total + price;
  }, 0);
}

export function calculateAdvanceAmount(totalAmount: number): number {
  return Math.round(totalAmount * 0.3);
}

export function calculateFullPaymentDiscount(totalAmount: number): number {
  return Math.round(totalAmount * 0.1);
}

export function calculateFullPaymentAmount(totalAmount: number): number {
  return totalAmount - calculateFullPaymentDiscount(totalAmount);
}


