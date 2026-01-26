/**
 * Security utilities for XSS prevention and input sanitization
 */

// XSS escape mapping
const escapeMap = {
  "&": "&",
  "<": "<",
  ">": ">",
  '"': '"',
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Escape HTML entities to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export const escapeHtml = (str) => {
  if (typeof str !== "string") return str;
  return str.replace(/[&<>"'`=/]/g, (char) => escapeMap[char]);
};

/**
 * Sanitize user input to remove potentially dangerous content
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  // Remove null bytes
  input = input.replace(/\0/g, "");

  // Trim whitespace
  input = input.trim();

  // Remove potential script tags (case insensitive)
  input = input.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

  // Remove event handlers
  input = input.replace(/\s*on\w+\s*=\s*(['"])[^'"]*\1/gi, "");

  // Remove javascript: and data: URLs
  input = input.replace(/javascript:[^\s]*/gi, "");
  input = input.replace(/data:[^\s]*/gi, "");

  return input;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with strength score
 */
export const validatePassword = (password) => {
  const result = {
    isValid: false,
    score: 0,
    errors: [],
  };

  if (!password) {
    result.errors.push("Password is required");
    return result;
  }

  if (password.length < 6) {
    result.errors.push("Password must be at least 6 characters");
  }

  if (password.length > 128) {
    result.errors.push("Password must be less than 128 characters");
  }

  // Check for lowercase
  if (/[a-z]/.test(password)) {
    result.score++;
  }

  // Check for uppercase
  if (/[A-Z]/.test(password)) {
    result.score++;
  }

  // Check for numbers
  if (/\d/.test(password)) {
    result.score++;
  }

  // Check for special characters
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.score++;
  }

  result.isValid = result.errors.length === 0 && result.score >= 3;

  return result;
};

/**
 * Sanitize HTML content (for when you need to allow some HTML)
 * @param {string} html - HTML to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (html) => {
  if (typeof html !== "string") return "";

  // Create a temporary element
  const temp = document.createElement("div");
  temp.textContent = html;
  return temp.innerHTML;
};

/**
 * Validate and sanitize URLs
 * @param {string} url - URL to validate
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export const sanitizeUrl = (url) => {
  if (!url) return null;

  // Remove whitespace
  url = url.trim();

  // Check for dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];
  for (const protocol of dangerousProtocols) {
    if (url.toLowerCase().startsWith(protocol)) {
      return null;
    }
  }

  // If it's a relative URL, return it as is
  if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) {
    return url;
  }

  // If it's an absolute URL, validate it
  try {
    const parsed = new URL(url);
    if (["http:", "https:"].includes(parsed.protocol)) {
      return url;
    }
  } catch {
    // Invalid URL
    return null;
  }

  return null;
};

/**
 * Generate a secure random token
 * @param {number} length - Token length
 * @returns {string} - Random token
 */
export const generateSecureToken = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
};

/**
 * Check if a string contains potentially harmful patterns
 * @param {string} str - String to check
 * @returns {boolean} - Contains harmful patterns
 */
export const containsHarmfulPatterns = (str) => {
  const patterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /expression\s*\(/i,
    /data:/i,
    /vbscript:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
  ];

  return patterns.some((pattern) => pattern.test(str));
};

/**
 * Secure storage wrapper for localStorage
 */
export const secureStorage = {
  set(key, value) {
    try {
      const encrypted = btoa(JSON.stringify(value));
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error("Error setting secure storage:", error);
    }
  },

  get(key) {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return JSON.parse(atob(encrypted));
    } catch (error) {
      console.error("Error getting secure storage:", error);
      return null;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  },
};

export default {
  escapeHtml,
  sanitizeInput,
  isValidEmail,
  validatePassword,
  sanitizeHtml,
  sanitizeUrl,
  generateSecureToken,
  containsHarmfulPatterns,
  secureStorage,
};
