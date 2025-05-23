import { useContext } from 'react';
import { NotificationContext } from './NotificationContext.jsx';
/**
 * Custom hook to use the NotificationContext.
 * @returns {Object} The context value containing notifications and methods to manage them.
 * @throws Will throw an error if used outside of NotificationProvider.
 */

const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export default useNotifications;
