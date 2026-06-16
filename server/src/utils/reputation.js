export function getReputationTier(trustScore) {
  if (trustScore >= 100) return { label: 'Verified citizen',  color: 'purple', minScore: 100 };
  if (trustScore >= 50)  return { label: 'Active reporter',   color: 'blue',   minScore: 50  };
  if (trustScore >= 20)  return { label: 'Community member',  color: 'teal',   minScore: 20  };
  if (trustScore >= 5)   return { label: 'New reporter',      color: 'amber',  minScore: 5   };
  return                        { label: 'Observer',          color: 'gray',   minScore: 0   };
}
