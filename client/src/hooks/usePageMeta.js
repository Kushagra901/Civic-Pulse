import { useEffect } from 'react';

const DEFAULT_TITLE = 'CivicPulse — Local issues, publicly accountable';
const DEFAULT_DESC   = 'Report broken streetlights, water leaks, and unsafe roads. Track every status change publicly with evidence-based credibility scoring.';

export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title ? `${title} · CivicPulse` : DEFAULT_TITLE;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description || DEFAULT_DESC);
    }

    // Reset to defaults when navigating away from this page
    return () => {
      document.title = DEFAULT_TITLE;
      if (metaDesc) metaDesc.setAttribute('content', DEFAULT_DESC);
    };
  }, [title, description]);
}
