import { createContext, useState, useCallback, useRef } from 'react';

export const NotificationContext = createContext();

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

    const success = useCallback((message, duration = 5000) => addNotification(message, 'success', duration), [addNotification]);
    const error = useCallback((message, duration = 7000) => addNotification(message, 'error', duration), [addNotification]);
    const info = useCallback((message, duration = 5000) => addNotification(message, 'info', duration), [addNotification]);
    const warning = useCallback((message, duration = 6000) => addNotification(message, 'warning', duration), [addNotification]);

    const values = {
        notifications,
        addNotification,
        removeNotification,
        success,
        error,
        info,
        warning
    };

    return (
        <NotificationContext.Provider value={values}>
            {children}
        </NotificationContext.Provider>
    );
};
