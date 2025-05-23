import { useContext } from 'react';
import NotificationContext from '../contexts/NotificationContext.jsx';
/**
 * Custom hook to access the NotificationContext.
 * @returns {Object} The context value containing notifications and methods to manage them.
 * @throws Will throw an error if used outside of NotificationProvider.
 * 
 * @example
 * const { notifications, addNotification, removeNotification } = useNotifications();
 */

const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export default useNotifications;
