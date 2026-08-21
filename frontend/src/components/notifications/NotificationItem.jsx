import { BriefcaseBusiness, CheckCircle2, MessageSquare } from "lucide-react";

function renderIcon(type) {
  const normalizedType = String(type || "").toLowerCase();

  if (normalizedType.includes("application")) {
    return <BriefcaseBusiness />;
  }

  if (normalizedType.includes("approved") || normalizedType.includes("selected")) {
    return <CheckCircle2 />;
  }

  return <MessageSquare />;
}

function formatDate(value) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationItem({ notification, onOpen }) {
  return (
    <button
      type="button"
      className={`notification-item ${
        notification?.isRead ? "notification-item-read" : "notification-item-unread"
      }`}
      onClick={() => onOpen(notification)}
    >
      <span className="notification-item-icon">
        {renderIcon(notification?.type)}
      </span>

      <span className="notification-item-content">
        <strong>{notification?.title || "Recruitment update"}</strong>
        <small>
          {notification?.message || "You have a new recruitment update."}
        </small>
        <em>{formatDate(notification?.createdAt)}</em>
      </span>

      {!notification?.isRead && <span className="notification-item-dot" />}
    </button>
  );
}
