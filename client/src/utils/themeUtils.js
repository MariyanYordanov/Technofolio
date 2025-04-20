/* client/src/utils/themeUtils.js */
// Променлива, която следи дали темата вече е инициализирана
let themeInitialized = false;

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
    // Проверяваме дали темата вече е инициализирана, за да избегнем многократно изпълнение
    if (themeInitialized) {
        return;
    }

    const savedTheme = localStorage.getItem('theme') || 'light';

    // Изчистваме всички темови класове преди да добавим новия
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${savedTheme}-theme`);

    themeInitialized = true;
    return savedTheme;
};