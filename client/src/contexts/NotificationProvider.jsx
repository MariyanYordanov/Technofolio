import { useState, useCallback, useRef } from 'react';
import NotificationContext from '../utils/notificationsUtils';

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const removeNotificationRef = useRef(null);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    removeNotificationRef.current = removeNotification;

    const addNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                if (removeNotificationRef.current) {
                    removeNotificationRef.current(id);
                }
            }, duration);
        }

        return id;
    }, []);

    const success = useCallback((message, duration) => {
        return addNotification(message, 'success', duration);
    }, [addNotification]);

    const error = useCallback((message, duration) => {
        return addNotification(message, 'error', duration);
    }, [addNotification]);

    const info = useCallback((message, duration) => {
        return addNotification(message, 'info', duration);
    }, [addNotification]);

    const values = {
        notifications,
        addNotification,
        removeNotification,
        success,
        error,
        info
    };

    return (
        <NotificationContext.Provider value={values}>
            {children}
        </NotificationContext.Provider>
    );
};