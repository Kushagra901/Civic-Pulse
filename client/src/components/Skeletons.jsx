import React from "react";

// Base pulse wrapper
function Bone({ className }) {
  return (
    <div className={`bg-slate-100 rounded animate-pulse ${className}`} />
  );
}

export function IncidentCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4">
      <Bone className="w-16 h-16 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <Bone className="h-4 w-3/4" />
        <Bone className="h-3 w-1/3" />
        <div className="flex justify-between">
          <Bone className="h-3 w-1/4" />
          <Bone className="h-3 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function IncidentDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-5 animate-pulse">
      <Bone className="h-7 w-2/3" />
      <div className="flex gap-2">
        <Bone className="h-5 w-20 rounded-full" />
        <Bone className="h-5 w-16 rounded-full" />
      </div>
      <Bone className="h-48 rounded-2xl" />
      <div className="space-y-3">
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
        <Bone className="h-4 w-4/6" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-5 animate-pulse">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex gap-5">
        <Bone className="w-14 h-14 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Bone className="h-5 w-1/3" />
          <Bone className="h-3 w-1/4" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Bone key={i} className="h-20 rounded-xl" />)}
      </div>
      <Bone className="h-48 rounded-2xl" />
    </div>
  );
}

export function FeedSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <IncidentCardSkeleton key={i} />
      ))}
    </div>
  );
}
