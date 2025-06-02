// client/src/services/adminService.js
import * as request from '../utils/requestUtils.js';

const endpoints = {
    users: '/api/users',
    credits: '/api/credits',
    events: '/api/events',
    reports: '/api/reports',
    system: '/api/system'
};

// ===== ПОТРЕБИТЕЛИ =====

// Получаване на статистики за потребители
export const getUsersStatistics = async () => {
    try {
        const result = await request.get(`${endpoints.users}/stats`);
        return result.stats || {
            total: 0,
            students: 0,
            teachers: 0,
            admins: 0,
            active: 0,
            inactive: 0
        };
    } catch (error) {
        console.error('Error fetching users statistics:', error);
        throw error;
    }
};

// Получаване на всички потребители с филтриране
export const getAllUsers = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (filters.page) queryParams.append('page', filters.page);
        if (filters.limit) queryParams.append('limit', filters.limit);
        if (filters.role) queryParams.append('role', filters.role);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.status) queryParams.append('status', filters.status);

        const url = queryParams.toString() ?
            `${endpoints.users}?${queryParams.toString()}` :
            endpoints.users;

        const result = await request.get(url);
        return result;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

// Обновяване на потребителска роля
export const updateUserRole = async (userId, newRole) => {
    try {
        const result = await request.patch(`${endpoints.users}/${userId}/change-role`, { role: newRole });
        return result.user || result;
    } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
};

// Активиране/деактивиране на потребител
export const toggleUserStatus = async (userId) => {
    try {
        const result = await request.patch(`${endpoints.users}/${userId}/toggle-account`);
        return result.user || result;
    } catch (error) {
        console.error('Error toggling user status:', error);
        throw error;
    }
};

// Изтриване на потребител
export const deleteUser = async (userId) => {
    try {
        const result = await request.del(`${endpoints.users}/${userId}`);
        return result;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

// ===== КРЕДИТНИ КАТЕГОРИИ =====

// Получаване на всички категории
export const getCreditCategories = async () => {
    try {
        const result = await request.get(`${endpoints.credits}/categories`);
        return result.categoriesByPillar || {};
    } catch (error) {
        console.error('Error fetching credit categories:', error);
        throw error;
    }
};

// Добавяне на категория
export const addCreditCategory = async (categoryData) => {
    try {
        const result = await request.post(`${endpoints.credits}/categories`, categoryData);
        return result.category || result;
    } catch (error) {
        console.error('Error adding credit category:', error);
        throw error;
    }
};

// Обновяване на категория
export const updateCreditCategory = async (categoryId, updateData) => {
    try {
        const result = await request.put(`${endpoints.credits}/categories/${categoryId}`, updateData);
        return result.category || result;
    } catch (error) {
        console.error('Error updating credit category:', error);
        throw error;
    }
};

// Изтриване на категория
export const deleteCreditCategory = async (categoryId) => {
    try {
        const result = await request.del(`${endpoints.credits}/categories/${categoryId}`);
        return result;
    } catch (error) {
        console.error('Error deleting credit category:', error);
        throw error;
    }
};

// ===== СТАТИСТИКИ =====

// Получаване на статистики за кредити
export const getCreditsStatistics = async () => {
    try {
        const result = await request.get(`${endpoints.credits}/stats`);
        return result.stats || {
            total: 0,
            pending: 0,
            validated: 0,
            rejected: 0,
            byPillar: {},
            byGrade: {},
            recentActivity: []
        };
    } catch (error) {
        console.error('Error fetching credits statistics:', error);
        throw error;
    }
};

// Получаване на статистики за събития
export const getEventsStatistics = async () => {
    try {
        const result = await request.get(`${endpoints.events}/stats/overview`);
        return result.stats || {
            total: 0,
            upcoming: 0,
            past: 0,
            totalParticipants: 0,
            avgParticipantsPerEvent: 0,
            popularEvents: []
        };
    } catch (error) {
        console.error('Error fetching events statistics:', error);
        throw error;
    }
};

// ===== СИСТЕМНИ НАСТРОЙКИ =====

// Получаване на системни настройки
export const getSystemSettings = async () => {
    try {
        const result = await request.get(`${endpoints.system}/settings`);
        return result.settings || {};
    } catch (error) {
        console.error('Error fetching system settings:', error);
        throw error;
    }
};

// Обновяване на системни настройки
export const updateSystemSettings = async (settings) => {
    try {
        const result = await request.patch(`${endpoints.system}/settings`, settings);
        return result.settings || result;
    } catch (error) {
        console.error('Error updating system settings:', error);
        throw error;
    }
};

// ===== СИСТЕМЕН ЛОГ =====

// Получаване на системни логове
export const getSystemLogs = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (filters.page) queryParams.append('page', filters.page);
        if (filters.limit) queryParams.append('limit', filters.limit);
        if (filters.level) queryParams.append('level', filters.level);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        if (filters.userId) queryParams.append('userId', filters.userId);

        const url = queryParams.toString() ?
            `${endpoints.system}/logs?${queryParams.toString()}` :
            `${endpoints.system}/logs`;

        const result = await request.get(url);
        return result;
    } catch (error) {
        console.error('Error fetching system logs:', error);
        throw error;
    }
};

// ===== АРХИВИРАНЕ =====

// Създаване на архив
export const createBackup = async () => {
    try {
        const result = await request.post(`${endpoints.system}/backup`);
        return result;
    } catch (error) {
        console.error('Error creating backup:', error);
        throw error;
    }
};

// Получаване на списък с архиви
export const getBackups = async () => {
    try {
        const result = await request.get(`${endpoints.system}/backups`);
        return result.backups || [];
    } catch (error) {
        console.error('Error fetching backups:', error);
        throw error;
    }
};

// Възстановяване от архив
export const restoreBackup = async (backupId) => {
    try {
        const result = await request.post(`${endpoints.system}/restore/${backupId}`);
        return result;
    } catch (error) {
        console.error('Error restoring backup:', error);
        throw error;
    }
};

// ===== ОТЧЕТИ =====

// Генериране на системен отчет
export const generateSystemReport = async (reportType, params = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.format) queryParams.append('format', params.format);

        const url = queryParams.toString() ?
            `${endpoints.reports}/system/${reportType}?${queryParams.toString()}` :
            `${endpoints.reports}/system/${reportType}`;

        const result = await request.get(url);
        return result.report || result;
    } catch (error) {
        console.error('Error generating system report:', error);
        throw error;
    }
};

// Експортиране на данни
export const exportData = async (dataType, format = 'json') => {
    try {
        const response = await fetch(`http://localhost:3030/api/system/export/${dataType}?format=${format}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Грешка при експортиране: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${dataType}_export_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return true;
    } catch (error) {
        console.error('Error exporting data:', error);
        throw error;
    }
};