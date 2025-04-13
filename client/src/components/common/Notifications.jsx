import { useNotifications } from '../../contexts/NotificationContext';
import './Notifications.css';

export default function Notifications() {
    const { notifications, removeNotification } = useNotifications();

    return (
        <div className="notifications-container">
            {notifications.map(notification => (
                <div key={notification.id} className={`notification notification-${notification.type}`}>
                    <div className="notification-content">
                        <span>{notification.message}</span>
                        <button
                            className="notification-close"
                            onClick={() => removeNotification(notification.id)}
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}