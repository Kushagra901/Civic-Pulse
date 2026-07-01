import { Link } from 'react-router-dom';

export default function BrandLogo({ to = '/', className = '', compact = false }) {
  const inner = (
    <>
      <div className="h-8 w-8 rounded-md bg-signal flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor" aria-hidden="true">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
        </svg>
      </div>
      {!compact && (
        <span className="font-display text-base text-ink tracking-tight">
          Civic<span className="text-signal">Pulse</span>
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`flex items-center gap-2.5 ${className}`}>
        {inner}
      </Link>
    );
  }

  return <div className={`flex items-center gap-2.5 ${className}`}>{inner}</div>;
}
