import { Bell, CheckCircle2, Trash2, X } from "lucide-react";

import NotificationItem from "./NotificationItem";

export default function NotificationPanel({
  notifications,
  unreadCount,
  error,
  onClose,
  onOpenNotification,
  onMarkAllRead,
  onClearAll,
}) {
  const hasNotifications = notifications.length > 0;

  return (
    <div className="notification-panel">
      <div className="notification-panel-header">
        <div>
          <strong>Notifications</strong>
          <span>
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </span>
        </div>

        <button type="button" onClick={onClose} aria-label="Close notifications">
          <X />
        </button>
      </div>

      {error && <p className="notification-panel-error">{error}</p>}

      <div className="notification-panel-list">
        {hasNotifications ? (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onOpen={onOpenNotification}
            />
          ))
        ) : (
          <div className="notification-panel-empty">
            <Bell />
            <strong>No notifications</strong>
            <span>Application and recruitment updates will appear here.</span>
          </div>
        )}
      </div>

      {hasNotifications && (
        <div className="notification-panel-footer">
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCircle2 />
            Mark all read
          </button>

          <button type="button" onClick={onClearAll}>
            <Trash2 />
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
