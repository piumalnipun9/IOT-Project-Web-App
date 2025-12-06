import { VALIDATION } from './constants';

/**
 * Validate bulb ID format
 */
export function validateBulbId(bulbId) {
  if (!bulbId || typeof bulbId !== 'string') {
    return { valid: false, error: 'Bulb ID is required' };
  }
  
  if (!VALIDATION.BULB_ID_PATTERN.test(bulbId)) {
    return { valid: false, error: VALIDATION.BULB_ID_ERROR };
  }
  
  return { valid: true };
}

/**
 * Validate brightness value (0-100)
 */
export function validateBrightness(brightness) {
  const num = Number(brightness);
  if (isNaN(num) || num < 0 || num > 100) {
    return { valid: false, error: 'Brightness must be between 0 and 100' };
  }
  return { valid: true, value: num };
}

/**
 * Validate color hex code
 */
export function validateColor(color) {
  if (!color || typeof color !== 'string') {
    return { valid: false, error: 'Color is required' };
  }
  
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  if (!hexPattern.test(color)) {
    return { valid: false, error: 'Color must be a valid hex code (e.g., #FF5733)' };
  }
  
  return { valid: true };
}

/**
 * Validate MQTT broker URL
 */
export function validateMqttUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Broker URL is required' };
  }
  
  const wsPattern = /^wss?:\/\/.+/;
  if (!wsPattern.test(url)) {
    return { valid: false, error: 'URL must start with ws:// or wss://' };
  }
  
  return { valid: true };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '')
    .trim();
}
