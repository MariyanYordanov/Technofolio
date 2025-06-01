// server/utils/helpers.js
/**
 * Безопасно сравнява два MongoDB ObjectId или string ID
 * @param {string|ObjectId} id1 
 * @param {string|ObjectId} id2 
 * @returns {boolean}
 */
export const compareIds = (id1, id2) => {
    if (!id1 || !id2) return false;
    return id1.toString() === id2.toString();
};

/**
 * Конвертира ID към string
 * @param {string|ObjectId} id 
 * @returns {string}
 */
export const toStringId = (id) => {
    if (!id) return '';
    return id.toString();
};

/**
 * Проверява дали даден string е валиден MongoDB ObjectId
 * @param {string} id 
 * @returns {boolean}
 */
export const isValidObjectId = (id) => {
    if (!id) return false;
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
};

/**
 * Форматира дата в български формат
 * @param {Date} date 
 * @returns {string}
 */
export const formatDateBG = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};

/**
 * Генерира slug от текст
 * @param {string} text 
 * @returns {string}
 */
export const slugify = (text) => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

/**
 * Изчислява процент
 * @param {number} value 
 * @param {number} total 
 * @param {number} decimals 
 * @returns {number}
 */
export const calculatePercentage = (value, total, decimals = 2) => {
    if (!total || total === 0) return 0;
    const percentage = (value / total) * 100;
    return Math.round(percentage * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Групира масив от обекти по ключ
 * @param {Array} array 
 * @param {string} key 
 * @returns {Object}
 */
export const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) result[group] = [];
        result[group].push(item);
        return result;
    }, {});
};

/**
 * Премахва дублиращи се елементи от масив
 * @param {Array} array 
 * @param {string} key 
 * @returns {Array}
 */
export const removeDuplicates = (array, key) => {
    if (!key) {
        return [...new Set(array)];
    }

    const seen = new Set();
    return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
};

/**
 * Валидира имейл адрес
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Генерира случаен string
 * @param {number} length 
 * @returns {string}
 */
export const generateRandomString = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};