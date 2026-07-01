/** Shared CivicPulse design tokens — import instead of duplicating per page. */

export const CATEGORY = {
  WATER:       { label: 'Water',       color: '#2B6CB0', abbr: 'W' },
  ELECTRICITY: { label: 'Electricity', color: '#B7791F', abbr: 'E' },
  ROAD:        { label: 'Road',        color: '#5A6268', abbr: 'R' },
  SAFETY:      { label: 'Safety',      color: '#C53030', abbr: 'S' },
  SANITATION:  { label: 'Sanitation',  color: '#276749', abbr: 'N' },
  OTHER:       { label: 'Other',       color: '#6B6560', abbr: 'O' },
};

export const STATUS = {
  REPORTED:    'bg-stone-100 text-stone-600 border-stone-200',
  TRIAGED:     'bg-amber-50 text-amber-800 border-amber-200',
  ASSIGNED:    'bg-sky-50 text-sky-800 border-sky-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  RESOLVED:    'bg-forest-50 text-forest border-forest-200',
  VERIFIED:    'bg-forest-50 text-forest border-forest-200',
  CLOSED:      'bg-stone-100 text-stone-500 border-stone-200',
};

export const TIER = {
  purple: 'bg-violet-100 text-violet-900',
  blue:   'bg-sky-100 text-sky-900',
  teal:   'bg-teal-100 text-teal-900',
  amber:  'bg-amber-100 text-amber-900',
  gray:   'bg-stone-100 text-stone-600',
};

export function categoryMeta(key) {
  return CATEGORY[key] || CATEGORY.OTHER;
}

export function formatStatus(status) {
  return status ? status.replace(/_/g, ' ') : 'REPORTED';
}

export function formatAge(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export function credClass(score) {
  if (score >= 10) return 'bg-forest-50 text-forest border-forest-200';
  if (score >= 5)  return 'bg-amber-50 text-amber-800 border-amber-200';
  return 'bg-stone-50 text-stone-500 border-stone-200';
}
