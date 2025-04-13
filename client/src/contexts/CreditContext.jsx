import { createContext, useReducer, useContext, useEffect, useCallback } from "react";
import * as creditService from '../components/services/creditService';
import AuthContext from '../contexts/AuthContext';

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
        default:
            return state;
    }
};

export const CreditProvider = ({
    children,
}) => {
    const { userId, isAuthenticated } = useContext(AuthContext);
    const [state, dispatch] = useReducer(creditReducer, {
        credits: [],
        categories: [],
        loading: true,
        error: null,
    });

    const loadCredits = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const credits = await creditService.getStudentCredits(userId);
            dispatch({ type: 'SET_CREDITS', payload: credits });
        } catch (error) {
            console.log(error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    }, [userId, dispatch]);

    const loadCreditCategories = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const categories = await creditService.getCreditCategories();
            dispatch({ type: 'SET_CREDIT_CATEGORIES', payload: categories });
        } catch (error) {
            console.log(error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && userId) {
            loadCredits();
            loadCreditCategories();
        }
    }, [isAuthenticated, userId, loadCredits, loadCreditCategories]);

    const addCredit = useCallback(async (creditData) => {
        try {
            const newCredit = await creditService.addCredit(userId, creditData);
            dispatch({ type: 'ADD_CREDIT', payload: newCredit });
            return newCredit;
        } catch (error) {
            console.log(error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    }, [userId]);

    const updateCredit = useCallback(async (creditId, creditData) => {
        try {
            const updatedCredit = await creditService.updateCredit(creditId, creditData);
            dispatch({ type: 'UPDATE_CREDIT', payload: updatedCredit });
            return updatedCredit;
        } catch (error) {
            console.log(error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    }, []);

    const deleteCredit = useCallback(async (creditId) => {
        try {
            await creditService.deleteCredit(creditId);
            dispatch({ type: 'DELETE_CREDIT', payload: creditId });
        } catch (error) {
            console.log(error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    }, []);

    const getStudentGradeLevel = useCallback(() => {
        if (!state.credits.length) return 'Начинаещ';

        const totalCredits = state.credits.length;

        if (totalCredits >= 15) {
            return 'Мастър';
        } else if (totalCredits >= 8) {
            return 'Напреднал';
        } else {
            return 'Начинаещ';
        }
    }, [state.credits]);

    const getCompletedCredits = useCallback((pillar) => {
        if (!state.credits.length) return 0;

        if (pillar) {
            return state.credits.filter(credit => credit.pillar === pillar).length;
        }

        return state.credits.length;
    }, [state.credits]);

    const values = {
        ...state,
        loadCredits,
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