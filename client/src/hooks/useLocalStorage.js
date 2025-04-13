import { useState } from 'react';

export const useLocalStorage = (key, initialValue) => {
    const [state, setState] = useState(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.log(error);
            return initialValue;
        }
    });

    const setItem = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(state) : value;
            setState(valueToStore);
            localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.log(error);
        }
    };

    return [state, setItem];
};