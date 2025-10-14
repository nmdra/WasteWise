/**
 * Common Waste Types Configuration
 * Used across bins, schedules, and all waste management features
 */

export const WASTE_TYPES = {
  plastic: {
    id: 'plastic',
    label: 'Plastic & Polythene',
    icon: '♻️',
    color: '#F59E0B',
    description: 'Plastic bottles, bags, containers, polythene',
  },
  paper: {
    id: 'paper',
    label: 'Paper & Cardboard',
    icon: '📄',
    color: '#3B82F6',
    description: 'Newspapers, cardboard, paper waste',
  },
  organic: {
    id: 'organic',
    label: 'Organic & Food Waste',
    icon: '🍂',
    color: '#84CC16',
    description: 'Food scraps, garden waste, compostable materials',
  },
  glass: {
    id: 'glass',
    label: 'Glass',
    icon: '🍾',
    color: '#10B981',
    description: 'Glass bottles, jars, containers',
  },
  metal: {
    id: 'metal',
    label: 'Metal',
    icon: '🥫',
    color: '#6B7280',
    description: 'Cans, metal containers, scrap metal',
  },
  electronic: {
    id: 'electronic',
    label: 'E-Waste',
    icon: '🔌',
    color: '#8B5CF6',
    description: 'Electronics, batteries, electrical items',
  },
  hazardous: {
    id: 'hazardous',
    label: 'Hazardous Waste',
    icon: '⚠️',
    color: '#EF4444',
    description: 'Chemicals, paints, toxic materials',
  },
  general: {
    id: 'general',
    label: 'General Waste',
    icon: '🗑️',
    color: '#6B7280',
    description: 'Mixed waste, non-recyclable items',
  },
};

/**
 * Get array of all waste type IDs
 */
export const WASTE_TYPE_IDS = Object.keys(WASTE_TYPES);

/**
 * Get array of all waste type objects
 */
export const WASTE_TYPE_LIST = Object.values(WASTE_TYPES);

/**
 * Get waste type by ID (case-insensitive)
 */
export const getWasteType = (id) => {
  if (!id) return null;
  const lowercaseId = id.toLowerCase();
  return WASTE_TYPES[lowercaseId] || null;
};

/**
 * Get waste type color
 */
export const getWasteTypeColor = (id) => {
  const type = getWasteType(id);
  return type ? type.color : '#6B7280';
};

/**
 * Get waste type icon
 */
export const getWasteTypeIcon = (id) => {
  const type = getWasteType(id);
  return type ? type.icon : '🗑️';
};

/**
 * Get waste type label
 */
export const getWasteTypeLabel = (id) => {
  const type = getWasteType(id);
  return type ? type.label : 'Unknown';
};

/**
 * Check if a waste type ID is valid
 */
export const isValidWasteType = (id) => {
  if (!id) return false;
  return WASTE_TYPE_IDS.includes(id.toLowerCase());
};

/**
 * Normalize waste type ID to lowercase
 */
export const normalizeWasteType = (id) => {
  if (!id) return null;
  const lowercaseId = id.toLowerCase();
  return isValidWasteType(lowercaseId) ? lowercaseId : null;
};

/**
 * Match bin category to waste type
 * (For backwards compatibility)
 */
export const BIN_CATEGORY_TO_WASTE_TYPE = {
  plastic: 'plastic',
  paper: 'paper',
  organic: 'organic',
  glass: 'glass',
  metal: 'metal',
  electronic: 'electronic',
  hazardous: 'hazardous',
  general: 'general',
};

/**
 * Bin categories (using waste types)
 */
export const BIN_CATEGORIES = WASTE_TYPES;
