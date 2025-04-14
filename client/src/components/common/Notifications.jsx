// client/src/components/common/Notifications.jsx
import { useNotifications } from '../../utils/notificationsUtils';

export default function Notifications() {
    const { notifications, removeNotification } = useNotifications();

    if (notifications.length === 0) {
        return null;
    }

    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
            default:
                return 'ℹ';
        }
    };

    return (
        <div className="notifications-container">
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className={`notification notification-${notification.type}`}
                    role="alert"
                >
                    <div className="notification-content">
                        <span className="notification-icon">{getIcon(notification.type)}</span>
                        <span className="notification-message">{notification.message}</span>
                        <button
                            className="notification-close"
                            onClick={() => removeNotification(notification.id)}
                            aria-label="Затвори"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}