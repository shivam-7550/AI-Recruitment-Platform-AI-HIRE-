import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";

import { notificationApi } from "../../services/notificationService";
import NotificationPanel from "./NotificationPanel";

import "../../styles/notifications.css";

const DEFAULT_ROUTES = {
  User: "/user/applications",
  Company: "/company/posted-jobs",
  Admin: "/admin/jobs",
};

function currentUserKey(portalRole) {
  try {
    const user = JSON.parse(sessionStorage.getItem("user") || "null");

    return user?.userId || user?.id || user?.email || portalRole;
  } catch {
    return portalRole;
  }
}

function clearedStorageKey(portalRole) {
  return `clearedNotifications:${portalRole}:${currentUserKey(portalRole)}`;
}

function readClearedNotificationIds(portalRole) {
  try {
    const value = localStorage.getItem(clearedStorageKey(portalRole));

    return new Set(JSON.parse(value || "[]"));
  } catch {
    return new Set();
  }
}

function saveClearedNotificationIds(portalRole, ids) {
  localStorage.setItem(
    clearedStorageKey(portalRole),
    JSON.stringify([...ids]),
  );
}

export default function NotificationBell({
  portalRole = "User",
  pollInterval = 5000,
  maxItems = 50,
  onOpen,
  onClose,
  onNotificationsChange,
  resolveRoute,
}) {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const clearedIdsRef = useRef(readClearedNotificationIds(portalRole));

  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(() => {
    return notificationApi
      .mine()
      .then((items) => {
        const incomingNotifications = Array.isArray(items) ? items : [];

        const nextNotifications = incomingNotifications.filter(
          (item) => !clearedIdsRef.current.has(item?.id),
        );

        setNotifications(nextNotifications);
        onNotificationsChange?.(nextNotifications);
        setError("");
      })
      .catch((loadError) => {
        setError(loadError?.message || "Unable to load notifications.");
      });
  }, [onNotificationsChange]);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadNotifications, 0);

    if (!pollInterval) {
      return () => window.clearTimeout(initialLoad);
    }

    const refresh = window.setInterval(loadNotifications, pollInterval);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(refresh);
    };
  }, [loadNotifications, pollInterval]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [onClose]);

  const visibleNotifications = notifications.slice(0, maxItems);

  const unreadCount = visibleNotifications.filter((item) => !item.isRead).length;

  async function handleToggle() {
    const nextOpen = !open;

    setOpen(nextOpen);

    if (nextOpen) {
      onOpen?.();
      await loadNotifications();
    } else {
      onClose?.();
    }
  }

  async function handleOpenNotification(notification) {
    if (!notification) {
      return;
    }

    try {
      if (!notification.isRead) {
        await notificationApi.read(notification.id);

        setNotifications((current) => {
          const nextNotifications = current.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          );

          onNotificationsChange?.(nextNotifications);

          return nextNotifications;
        });
      }

      const route = resolveRoute
        ? resolveRoute(notification)
        : notification.jobId
          ? DEFAULT_ROUTES[portalRole]
          : null;

      setOpen(false);
      onClose?.();

      if (route) {
        navigate(route, {
          state: {
            jobId: notification.jobId,
            notificationType: notification.type,
          },
        });
      }
    } catch (openError) {
      setError(openError?.message || "Unable to open this notification.");
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationApi.markAllRead();

      setNotifications((current) => {
        const nextNotifications = current.map((item) => ({
          ...item,
          isRead: true,
        }));

        onNotificationsChange?.(nextNotifications);

        return nextNotifications;
      });
      setError("");
    } catch (markError) {
      setError(markError?.message || "Unable to mark notifications as read.");
    }
  }

  async function handleClearAll() {
    const nextClearedIds = new Set(clearedIdsRef.current);

    notifications.forEach((notification) => {
      if (notification?.id) {
        nextClearedIds.add(notification.id);
      }
    });

    clearedIdsRef.current = nextClearedIds;
    saveClearedNotificationIds(portalRole, nextClearedIds);

    setNotifications([]);
    onNotificationsChange?.([]);
    setError("");

    try {
      await notificationApi.clearAll();
    } catch (clearError) {
      console.error("Unable to persist notification clear:", clearError);
    }
  }

  return (
    <div className="notification-bell-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`notification-bell-button ${
          open ? "notification-bell-button-active" : ""
        }`}
        onClick={handleToggle}
        aria-label={`${unreadCount} unread notifications`}
        aria-expanded={open}
      >
        <Bell />

        {unreadCount > 0 && <i>{unreadCount > 9 ? "9+" : unreadCount}</i>}
      </button>

      {open && (
        <NotificationPanel
          notifications={visibleNotifications}
          unreadCount={unreadCount}
          error={error}
          onClose={() => {
            setOpen(false);
            onClose?.();
          }}
          onOpenNotification={handleOpenNotification}
          onMarkAllRead={handleMarkAllRead}
          onClearAll={handleClearAll}
        />
      )}
    </div>
  );
}
