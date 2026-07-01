import { STATUS, formatStatus } from '../lib/design.js';

export default function StatusBadge({ status, className = '' }) {
  const styles = STATUS[status] || STATUS.REPORTED;
  return (
    <span className={`status-pill ${styles} ${className}`}>
      {formatStatus(status)}
    </span>
  );
}

export function CredBadge({ score }) {
  const cls =
    score >= 10 ? 'bg-forest-50 text-forest border-forest-200' :
    score >= 5  ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  'bg-stone-50 text-stone-500 border-stone-200';

  return (
    <span className={`status-pill ${cls} normal-case tracking-normal`}>
      {Math.round(score)} cred
    </span>
  );
}
