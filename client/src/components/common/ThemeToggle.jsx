/* client/src/components/common/ThemeToggle.jsx */
import { useState, useEffect } from 'react';
import { initTheme, toggleTheme } from '../../utils/themeUtils.js';

export default function ThemeToggle() {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const currentTheme = initTheme();
        setTheme(currentTheme);
    }, []);

    const handleToggleTheme = () => {
        const newTheme = toggleTheme();
        setTheme(newTheme);
    };

    return (
        <button
            className="theme-toggle"
            onClick={handleToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    );
}