import { JSDOM }     from 'jsdom';
import DOMPurify     from 'dompurify';
import xss           from 'xss';
import validator     from 'validator';

// DOMPurify needs a DOM environment on Node.js
const { window } = new JSDOM('');
const purify     = DOMPurify(window);

/**
 * Sanitise a plain text field.
 * Strips all HTML, normalises whitespace, trims.
 * Use for: titles, names, area codes, team names.
 */
export function sanitiseText(input, maxLength = 500) {
  if (typeof input !== 'string') return '';

  return purify
    .sanitize(input, { ALLOWED_TAGS: [] })   // strip ALL HTML
    .replace(/\s+/g, ' ')                    // collapse whitespace
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitise rich text that may contain basic formatting.
 * Allows only safe tags: b, i, em, strong, p, br, ul, ol, li.
 * Use for: incident descriptions, timeline notes.
 */
export function sanitiseRichText(input, maxLength = 2000) {
  if (typeof input !== 'string') return '';

  const ALLOWED_TAGS  = ['b','i','em','strong','p','br','ul','ol','li'];
  const ALLOWED_ATTRS = {};   // no attributes on any tag

  return purify
    .sanitize(input, { ALLOWED_TAGS, ALLOWED_ATTR: ALLOWED_ATTRS })
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitise and validate an email address.
 * Returns normalised email or throws.
 */
export function sanitiseEmail(input) {
  if (typeof input !== 'string') {
    throw new Error('Email must be a string');
  }

  const normalised = validator.normalizeEmail(input.trim().toLowerCase(), {
    gmail_remove_dots:      false,
    gmail_remove_subaddress: false,
    outlookdotcom_remove_subaddress: false,
  });

  if (!normalised || !validator.isEmail(normalised)) {
    throw new Error('Invalid email address');
  }

  return normalised;
}

/**
 * Validate and clamp geo coordinates.
 * Throws if outside valid ranges — prevents PostGIS injection.
 */
export function sanitiseCoordinates(lat, lng) {
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    throw new Error('Coordinates must be numbers');
  }
  if (parsedLat < -90 || parsedLat > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  if (parsedLng < -180 || parsedLng > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }

  // Round to 7 decimal places — ~1cm precision, prevents
  // floating point edge cases in PostGIS
  return {
    lat: Math.round(parsedLat * 1e7) / 1e7,
    lng: Math.round(parsedLng * 1e7) / 1e7,
  };
}

/**
 * Validate an array of Cloudinary URLs.
 * Rejects anything not pointing to your account.
 */
export function sanitisePhotoUrls(urls, cloudName) {
  if (!Array.isArray(urls)) return [];

  // If cloudName is not set, default to a generic match, otherwise validate strictly
  const allowedHost = cloudName ? `res.cloudinary.com/${cloudName}` : 'res.cloudinary.com';

  return urls
    .filter(url => {
      if (typeof url !== 'string') return false;
      if (!validator.isURL(url, { protocols: ['https'] })) return false;
      if (!url.includes(allowedHost)) return false;
      // No path traversal
      if (url.includes('../') || url.includes('..%2F')) return false;
      return true;
    })
    .slice(0, 5);   // hard cap at 5 photos
}

/**
 * Sanitise a search query before passing to PostgreSQL full-text search.
 * Strips tsquery special characters that could alter query semantics.
 */
export function sanitiseSearchQuery(q) {
  if (typeof q !== 'string') return '';

  return q
    .replace(/[&|!():*<>'"\\]/g, ' ')   // strip tsquery operators
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}
