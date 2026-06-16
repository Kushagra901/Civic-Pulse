import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext.jsx";
import { api } from "../api.js";

export default function NotificationBell() {
  const { subscribe } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Load existing notifications on mount
  useEffect(() => {
    api.get("/notifications?limit=15").then(data => {
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    }).catch(() => {});
  }, []);

  // Listen for new notifications arriving over the socket
  useEffect(() => {
    const unsub = subscribe("notification:new", (notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 50));
      setUnreadCount(c => c + 1);
    });
    return unsub;
  }, [subscribe]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(prev =>
        prev.map(n => ({ ...n, readAt: new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch (e) {}
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n),
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (e) {}
  }, []);

  return (
    <div className="relative" ref={panelRef}>

      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700
                   hover:bg-slate-100 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11
               a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4
               17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1
                           bg-red-500 text-white text-[10px] font-medium
                           rounded-full flex items-center justify-center
                           pointer-events-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border
                        border-slate-200 rounded-2xl shadow-lg z-50
                        overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          border-b border-slate-100">
            <h3 className="text-sm font-medium text-slate-800">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-700
                           transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-10">
                No notifications yet.
              </p>
            )}

            {notifications.map(notif => (
              <NotificationItem
                key={notif.id}
                notif={notif}
                onRead={() => markRead(notif.id)}
                onClose={() => setOpen(false)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notif, onRead, onClose }) {
  const isUnread = !notif.readAt;
  const age      = formatAge(notif.createdAt);

  const handleClick = () => {
    if (isUnread) onRead();
    onClose();
  };

  const content = (
    <div className={`flex gap-3 px-4 py-3 transition-colors cursor-pointer text-left
                     ${isUnread
                       ? "bg-blue-50/40 hover:bg-blue-50"
                       : "hover:bg-slate-50"}`}
         onClick={!notif.incidentId ? onRead : undefined}>
      <div className="flex-shrink-0 mt-px">
        <NotifIcon type={notif.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug
          ${isUnread ? "font-medium text-slate-900" : "text-slate-700"}`}>
          {notif.title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
          {notif.body}
        </p>
        <p className="text-xs text-slate-400 mt-1">{age}</p>
      </div>
      {isUnread && (
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
      )}
    </div>
  );

  // Wrap in a Link if there's an incident to navigate to
  if (notif.incidentId) {
    return (
      <Link to={`/incident/${notif.incidentId}`} onClick={handleClick}>
        {content}
      </Link>
    );
  }

  return content;
}

const NOTIF_ICONS = {
  STATUS_CHANGE: { emoji: "🔄", bg: "bg-blue-100" },
  REPORT_ADDED:  { emoji: "📋", bg: "bg-purple-100" },
  CONFIRMATION:  { emoji: "✓",  bg: "bg-green-100" },
};

function NotifIcon({ type }) {
  const { emoji, bg } = NOTIF_ICONS[type] || { emoji: "🔔", bg: "bg-slate-100" };
  return (
    <div className={`w-7 h-7 rounded-full ${bg} flex items-center
                     justify-center text-sm`}>
      {emoji}
    </div>
  );
}

function formatAge(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
