import React from "react";

const PRESETS = {
  incidents: {
    icon:    "📭",
    title:   "No incidents yet",
    message: "Be the first to report an issue in your area.",
  },
  search: {
    icon:    "🔍",
    title:   "No results",
    message: "Try adjusting your filters or search terms.",
  },
  timeline: {
    icon:    "🕐",
    title:   "No activity yet",
    message: "Updates to this incident will appear here.",
  },
  notifications: {
    icon:    "🔔",
    title:   "All caught up",
    message: "You don't have any notifications.",
  },
  error: {
    icon:    "⚠️",
    title:   "Failed to load",
    message: "Something went wrong. Please try again.",
  },
};

export function EmptyState({
  preset,
  icon, title, message,
  action,          // { label, onClick }
}) {
  const p = preset ? PRESETS[preset] : {};

  return (
    <div className="flex flex-col items-center justify-center
                    py-16 px-4 text-center">
      <p className="text-3xl mb-3" role="img" aria-hidden="true">
        {icon || p.icon}
      </p>
      <h3 className="text-sm font-medium text-gray-700 mb-1">
        {title || p.title}
      </h3>
      <p className="text-sm text-gray-400 max-w-xs">
        {message || p.message}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 text-sm text-blue-600 hover:text-blue-700
                     px-4 py-2 border border-blue-200 rounded-xl
                     hover:bg-blue-50 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
