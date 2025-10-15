// Payment configuration and pricing
export const MONTHLY_SERVICE_FEE = 300.00;
export const TAX_RATE = 0.08; // 8% tax

// Special pickup fees by waste type
export const SPECIAL_PICKUP_FEES = {
  'Organic Waste': 15.00,
  'Recyclable Waste': 20.00,
  'Electronic Waste': 35.00,
  'Hazardous Waste': 50.00,
  'Construction Debris': 75.00,
  'Large Items': 40.00,
  'Garden Waste': 25.00,
  'Glass': 10.00,
  'Paper': 8.00,
  'Plastic': 12.00,
  'Metal': 18.00,
  'Textile': 15.00,
};

// Additional services (can be added to monthly bills)
export const ADDITIONAL_SERVICES = {
  'Extra Pickup': 10.00,
  'Bin Cleaning': 5.00,
  'Compost Service': 15.00,
  'Recycling Plus': 8.00,
};

// Currency formatting utility
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Calculate monthly bill with optional additional services
export const calculateMonthlyBill = (months = 1, additionalServices = []) => {
  const subtotal = MONTHLY_SERVICE_FEE * months;
  
  const additionalCost = additionalServices.reduce((total, service) => {
    return total + (ADDITIONAL_SERVICES[service] || 0);
  }, 0);
  
  const totalSubtotal = subtotal + additionalCost;
  const tax = totalSubtotal * TAX_RATE;
  const total = totalSubtotal + tax;
  
  return {
    subtotal: totalSubtotal,
    tax,
    total,
    currency: 'USD',
    breakdown: {
      monthlyFee: MONTHLY_SERVICE_FEE * months,
      additionalServices: additionalCost,
      months,
    },
  };
};

// Calculate special booking fee based on waste types
export const calculateSpecialBookingFee = (wasteTypes = []) => {
  const breakdown = wasteTypes.map(wasteType => ({
    wasteType,
    fee: SPECIAL_PICKUP_FEES[wasteType] || 0,
  }));
  
  const subtotal = breakdown.reduce((total, item) => total + item.fee, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  
  return {
    subtotal,
    tax,
    total,
    currency: 'USD',
    breakdown,
  };
};

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Payment types
export const PAYMENT_TYPES = {
  MONTHLY_BILL: 'monthly_bill',
  SPECIAL_BOOKING: 'special_booking',
  PENALTY: 'penalty',
  REFUND: 'refund',
};