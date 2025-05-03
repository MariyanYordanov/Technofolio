// client/src/contexts/CreditContext.jsx
import { createContext, useReducer, useContext, useEffect, useCallback } from "react";
import * as creditService from '../services/creditService.js';
import * as studentService from '../services/studentService.js';
import AuthContext from './AuthContext.jsx';
import { useNotifications } from './NotificationContext.jsx';

const CreditContext = createContext();

const creditReducer = (state, action) => {
    switch (action.type) {
        case 'SET_CREDITS':
            return {
                ...state,
                credits: action.payload,
                loading: false,
            };
        case 'SET_CREDIT_CATEGORIES':
            return {
                ...state,
                categories: action.payload,
                loading: false,
            };
        case 'ADD_CREDIT':
            return {
                ...state,
                credits: [...state.credits, action.payload],
            };
        case 'UPDATE_CREDIT':
            return {
                ...state,
                credits: state.credits.map(credit =>
                    credit._id === action.payload._id ? action.payload : credit
                ),
            };
        case 'DELETE_CREDIT':
            return {
                ...state,
                credits: state.credits.filter(credit => credit._id !== action.payload),
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload,
            };
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                loading: false,
            };
        case 'SET_STUDENT_PROFILE':
            return {
                ...state,
                studentProfile: action.payload,
            };
        default:
            return state;
    }
};

export const CreditProvider = ({ children }) => {
    const { userId, isAuthenticated } = useContext(AuthContext);
    const { error: showError, success } = useNotifications();

    const [state, dispatch] = useReducer(creditReducer, {
        credits: [],
        categories: [],
        studentProfile: null,
        loading: true,
        error: null,
    });

    const loadStudentProfile = useCallback(async () => {
        try {
            const profile = await studentService.getStudentProfile(userId);
            if (profile) {
                dispatch({ type: 'SET_STUDENT_PROFILE', payload: profile });
                return profile;
            }
            return null;
        } catch (err) {
            console.error('Error loading student profile:', err);
            return null;
        }
    }, [userId]);

    const loadCredits = useCallback(async (studentId) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const credits = await creditService.getStudentCredits(studentId);
            dispatch({ type: 'SET_CREDITS', payload: credits });
            return credits;
        } catch (error) {
            console.error('Error loading credits:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            showError('Грешка при зареждане на кредитите');
            return [];
        }
    }, [showError]);

    const loadCreditCategories = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const categories = await creditService.getCreditCategories();
            dispatch({ type: 'SET_CREDIT_CATEGORIES', payload: categories });
            return categories;
        } catch (error) {
            console.error('Error loading credit categories:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            showError('Грешка при зареждане на категориите');
            return [];
        }
    }, [showError]);

    // Зареждане на данните при инициализация
    useEffect(() => {
        if (isAuthenticated && userId) {
            const initializeData = async () => {
                const profile = await loadStudentProfile();
                if (profile) {
                    await loadCredits(profile._id);
                    await loadCreditCategories();
                }
            };

            initializeData();
        }
    }, [isAuthenticated, userId, loadStudentProfile, loadCredits, loadCreditCategories]);

    const addCredit = useCallback(async (creditData) => {
        try {
            if (!state.studentProfile) {
                throw new Error('Не е зареден профил на ученик');
            }

            const newCredit = await creditService.addCredit(state.studentProfile._id, creditData);
            dispatch({ type: 'ADD_CREDIT', payload: newCredit });
            success('Кредитът е добавен успешно!');
            return newCredit;
        } catch (error) {
            console.error('Error adding credit:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            showError('Грешка при добавяне на кредит');
            throw error;
        }
    }, [state.studentProfile, success, showError]);

    const updateCredit = useCallback(async (creditId, creditData) => {
        try {
            const updatedCredit = await creditService.updateCredit(creditId, creditData);
            dispatch({ type: 'UPDATE_CREDIT', payload: updatedCredit });
            success('Кредитът е обновен успешно!');
            return updatedCredit;
        } catch (error) {
            console.error('Error updating credit:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            showError('Грешка при обновяване на кредит');
            throw error;
        }
    }, [success, showError]);

    const deleteCredit = useCallback(async (creditId) => {
        try {
            await creditService.deleteCredit(creditId);
            dispatch({ type: 'DELETE_CREDIT', payload: creditId });
            success('Кредитът е изтрит успешно!');
        } catch (error) {
            console.error('Error deleting credit:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            showError('Грешка при изтриване на кредит');
            throw error;
        }
    }, [success, showError]);

    const getStudentGradeLevel = useCallback(() => {
        if (!state.credits.length) return 'Начинаещ';

        const validatedCredits = state.credits.filter(credit => credit.status === 'validated').length;

        if (validatedCredits >= 15) {
            return 'Мастър';
        } else if (validatedCredits >= 8) {
            return 'Напреднал';
        } else {
            return 'Начинаещ';
        }
    }, [state.credits]);

    const getCompletedCredits = useCallback((pillar) => {
        if (!state.credits.length) return 0;

        const validatedCredits = state.credits.filter(credit => credit.status === 'validated');

        if (pillar) {
            return validatedCredits.filter(credit => credit.pillar === pillar).length;
        }

        return validatedCredits.length;
    }, [state.credits]);

    const values = {
        ...state,
        loadCredits,
        loadCreditCategories,
        addCredit,
        updateCredit,
        deleteCredit,
        getStudentGradeLevel,
        getCompletedCredits,
    };

    return (
        <CreditContext.Provider value={values}>
            {children}
        </CreditContext.Provider>
    );
};

CreditContext.displayName = 'CreditContext';

export default CreditContext;