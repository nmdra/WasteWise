/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString, format = 'long') => {
  const date = new Date(dateString);
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    case 'medium':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    case 'long':
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    case 'weekday':
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    default:
      return date.toLocaleDateString();
  }
};

/**
 * Calculate days until a given date
 */
export const getDaysUntil = (dateString) => {
  const targetDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Check if a date is today
 */
export const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Check if a date is in the past
 */
export const isPast = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  return date < today;
};

/**
 * Get relative time description
 */
export const getRelativeTime = (dateString) => {
  const days = getDaysUntil(dateString);
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1 && days <= 7) return `In ${days} days`;
  if (days < -1 && days >= -7) return `${Math.abs(days)} days ago`;
  if (days > 7) return formatDate(dateString, 'medium');
  return formatDate(dateString, 'medium');
};

/**
 * Generate a unique ID
 */
export const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

/**
 * Sort collections by date
 */
export const sortByDate = (collections, ascending = true) => {
  return [...collections].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

/**
 * Filter upcoming collections
 */
export const getUpcomingCollections = (collections, limit = null) => {
  const now = new Date();
  const upcoming = collections
    .filter(c => new Date(c.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return limit ? upcoming.slice(0, limit) : upcoming;
};

/**
 * Filter past collections
 */
export const getPastCollections = (collections, limit = null) => {
  const now = new Date();
  const past = collections
    .filter(c => new Date(c.date) < now)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return limit ? past.slice(0, limit) : past;
};

/**
 * Group collections by month
 */
export const groupByMonth = (collections) => {
  const grouped = {};
  
  collections.forEach(collection => {
    const date = new Date(collection.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(collection);
  });
  
  return grouped;
};

/**
 * Get next collection for a specific waste type
 */
export const getNextCollectionByType = (collections, wasteTypeId) => {
  const now = new Date();
  return collections
    .filter(c => c.wasteTypeId === wasteTypeId && new Date(c.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
};

/**
 * Calculate reminder date based on settings
 */
export const calculateReminderDate = (collectionDate, daysBefore = 1, time = '08:00') => {
  const date = new Date(collectionDate);
  date.setDate(date.getDate() - daysBefore);
  
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  
  return date;
};
