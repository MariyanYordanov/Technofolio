/* client/src/utils/themeUtils.js */
// Function to toggle between dark and light themes
export const toggleTheme = () => {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    // Save the theme preference
    localStorage.setItem('theme', newTheme);

    // Apply the theme to body
    document.body.classList.remove(`${currentTheme}-theme`);
    document.body.classList.add(`${newTheme}-theme`);

    return newTheme;
};

// Function to initialize theme
export const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(`${savedTheme}-theme`);
    return savedTheme;
};