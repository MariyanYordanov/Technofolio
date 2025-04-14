import { useState, useCallback, useRef, createContext, useContext } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

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

    const success = useCallback((message, duration = 5000) => {
        return addNotification(message, 'success', duration);
    }, [addNotification]);

    const error = useCallback((message, duration = 7000) => {
        return addNotification(message, 'error', duration);
    }, [addNotification]);

    const info = useCallback((message, duration = 5000) => {
        return addNotification(message, 'info', duration);
    }, [addNotification]);

    const warning = useCallback((message, duration = 6000) => {
        return addNotification(message, 'warning', duration);
    }, [addNotification]);

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

export default NotificationContext;
