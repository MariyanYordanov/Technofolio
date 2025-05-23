import { useState, useCallback, useRef } from 'react';
import NotificationContext from "../../contexts/NotificationContext.jsx";

const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const removeNotificationRef = useRef(null);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    removeNotificationRef.current = removeNotification;

    const addNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                removeNotificationRef.current?.(id);
            }, duration);
        }

        return id;
    }, []);

    const success = useCallback((msg, d = 5000) => addNotification(msg, 'success', d), [addNotification]);
    const error = useCallback((msg, d = 7000) => addNotification(msg, 'error', d), [addNotification]);
    const info = useCallback((msg, d = 5000) => addNotification(msg, 'info', d), [addNotification]);
    const warning = useCallback((msg, d = 6000) => addNotification(msg, 'warning', d), [addNotification]);

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

export default NotificationProvider;
