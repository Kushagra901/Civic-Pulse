import { categoryMeta } from '../lib/design.js';

export default function CategoryMark({ category, size = 'md', showLabel = false }) {
  const meta = categoryMeta(category);
  const sizes = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizes[size]} rounded-md flex items-center justify-center
                    font-mono font-semibold text-white flex-shrink-0`}
        style={{ backgroundColor: meta.color }}
        title={meta.label}
        aria-label={meta.label}
      >
        {meta.abbr}
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-ink-muted">{meta.label}</span>
      )}
    </div>
  );
}

export function CategoryDot({ category }) {
  const meta = categoryMeta(category);
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: meta.color }}
      aria-hidden="true"
    />
  );
}

export function CategoryLegend() {
  const entries = Object.entries(
    Object.fromEntries(
      Object.entries(require('../lib/design.js').CATEGORY).filter(([k]) => k !== 'OTHER')
    )
  );

  // Fix - can't use require in ESM. Import CATEGORY directly.
  return null;
}
