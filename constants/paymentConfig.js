// Payment configuration and pricing
export const MONTHLY_SERVICE_FEE = 300.00;
export const TAX_RATE = 0.08; // 8% tax

// Special pickup fees by waste type
export const SPECIAL_PICKUP_FEES = {
  hazardous: 45.00,
  electronic: 25.00,
  bulky: 35.00,
  organic: 15.00,
  plastic: 10.00,
  paper: 8.00,
  glass: 12.00,
  metal: 18.00,
  general: 5.00,
};

// Waste type information with icons and display names
export const WASTE_TYPE_INFO = {
  hazardous: { name: 'Hazardous', icon: '☢️', fee: SPECIAL_PICKUP_FEES.hazardous },
  electronic: { name: 'Electronic', icon: '📱', fee: SPECIAL_PICKUP_FEES.electronic },
  bulky: { name: 'Bulky Items', icon: '🛋️', fee: SPECIAL_PICKUP_FEES.bulky },
  organic: { name: 'Organic', icon: '🍎', fee: SPECIAL_PICKUP_FEES.organic },
  plastic: { name: 'Plastic', icon: '♻️', fee: SPECIAL_PICKUP_FEES.plastic },
  paper: { name: 'Paper', icon: '📄', fee: SPECIAL_PICKUP_FEES.paper },
  glass: { name: 'Glass', icon: '🍶', fee: SPECIAL_PICKUP_FEES.glass },
  metal: { name: 'Metal', icon: '🔩', fee: SPECIAL_PICKUP_FEES.metal },
  general: { name: 'General', icon: '🗑️', fee: SPECIAL_PICKUP_FEES.general },
};

// Get waste type information
export const getWasteTypeInfo = (wasteType) => {
  if (!wasteType || typeof wasteType !== 'string') {
    return { name: 'Unknown', icon: '♻️', fee: 0 };
  }
  
  return WASTE_TYPE_INFO[wasteType] || { 
    name: 'Unknown',
    icon: '♻️', 
    fee: 0 
  };
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
  // Handle negative months
  if (months < 0) months = 0;
  
  const serviceFee = MONTHLY_SERVICE_FEE * months;
  
  const additionalCost = additionalServices.reduce((total, service) => {
    return total + (service.fee || ADDITIONAL_SERVICES[service.name || service] || 0);
  }, 0);
  
  const totalSubtotal = serviceFee + additionalCost;
  const tax = totalSubtotal * TAX_RATE;
  const total = totalSubtotal + tax;
  
  return {
    subtotal: totalSubtotal,
    tax,
    total,
    currency: 'USD',
    breakdown: {
      serviceFee,
      additionalServices: additionalCost,
      months,
    },
  };
};

// Calculate special booking fee based on waste types
export const calculateSpecialBookingFee = (wasteTypes = []) => {
  // Filter out invalid waste types
  const validWasteTypes = wasteTypes.filter(type => 
    type && typeof type === 'string' && SPECIAL_PICKUP_FEES[type] !== undefined
  );
  
  const breakdown = validWasteTypes.map(wasteType => ({
    type: wasteType,
    wasteType,
    fee: SPECIAL_PICKUP_FEES[wasteType],
  }));
  
  const subtotal = breakdown.reduce((total, item) => total + item.fee, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  
  return {
    subtotal,
    tax,
    taxRate: TAX_RATE,
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