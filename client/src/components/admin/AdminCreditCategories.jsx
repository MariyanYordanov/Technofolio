// client/src/components/admin/AdminCreditCategories.jsx
import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import * as adminService from '../../services/adminService.js';
import * as creditService from '../../services/creditService.js';
import useNotifications from '../../hooks/useNotifications.js';
import useForm from '../../hooks/useForm.js';

export default function AdminCreditCategories() {
    const navigate = useNavigate();
    const { isAuthenticated, isAdmin } = useContext(AuthContext);
    const { success, error: showError } = useNotifications();

    const [categories, setCategories] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [selectedPillar, setSelectedPillar] = useState('all');

    const pillars = ['Аз и другите', 'Мислене', 'Професия'];

    // Зареждане на категории
    const fetchCategories = useCallback(async () => {
        try {
            if (!isAuthenticated || !isAdmin) {
                navigate('/');
                return;
            }

            setLoading(true);
            const result = await creditService.getCreditCategories();
            setCategories(result);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError(err.message || 'Грешка при зареждане на категориите.');
            setLoading(false);
        }
    }, [isAuthenticated, isAdmin, navigate]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Форма за добавяне/редактиране
    const { values, onChange, onSubmit, changeValues } = useForm(async (formValues) => {
        try {
            setLoading(true);

            if (editingCategory) {
                // Редактиране
                await adminService.updateCreditCategory(editingCategory.id, formValues);
                success('Категорията е обновена успешно!');
            } else {
                // Добавяне
                await adminService.addCreditCategory(formValues);
                success('Категорията е добавена успешно!');
            }

            await fetchCategories();
            setIsAddingCategory(false);
            setEditingCategory(null);
            changeValues({ pillar: '', name: '', description: '' });
        } catch (err) {
            console.error('Error saving category:', err);
            showError(err.message || 'Грешка при запазване на категорията.');
        } finally {
            setLoading(false);
        }
    }, {
        pillar: '',
        name: '',
        description: ''
    });

    // Изтриване на категория
    const handleDeleteCategory = async (categoryId, categoryName) => {
        if (!window.confirm(`Сигурни ли сте, че искате да изтриете категорията "${categoryName}"?`)) {
            return;
        }

        try {
            setLoading(true);
            await adminService.deleteCreditCategory(categoryId);
            success('Категорията е изтрита успешно!');
            await fetchCategories();
        } catch (err) {
            console.error('Error deleting category:', err);
            showError(err.message || 'Грешка при изтриване на категорията.');
        } finally {
            setLoading(false);
        }
    };

    // Започване на редактиране
    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setIsAddingCategory(true);
        changeValues({
            pillar: category.pillar,
            name: category.name,
            description: category.description || ''
        });
    };

    // Отказ от добавяне/редактиране
    const handleCancel = () => {
        setIsAddingCategory(false);
        setEditingCategory(null);
        changeValues({ pillar: '', name: '', description: '' });
    };

    // Филтриране на категории по стълб
    const getFilteredCategories = () => {
        if (selectedPillar === 'all') {
            return categories;
        }
        return { [selectedPillar]: categories[selectedPillar] || [] };
    };

    if (loading && !isAddingCategory) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <p>Зареждане на категории...</p>
            </div>
        );
    }

    if (error && !isAddingCategory) {
        return <div className="error">{error}</div>;
    }

    return (
        <section className="admin-credit-categories">
            <div className="page-header">
                <h1>Управление на кредитни категории</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/admin/dashboard')}
                >
                    Назад към таблото
                </button>
            </div>

            {/* Форма за добавяне/редактиране */}
            {isAddingCategory && (
                <div className="category-form-container">
                    <h2>{editingCategory ? 'Редактиране на категория' : 'Добавяне на нова категория'}</h2>
                    <form onSubmit={onSubmit} className="category-form">
                        <div className="form-group">
                            <label htmlFor="pillar">Стълб:</label>
                            <select
                                id="pillar"
                                name="pillar"
                                value={values.pillar}
                                onChange={onChange}
                                required
                            >
                                <option value="">Изберете стълб</option>
                                {pillars.map(pillar => (
                                    <option key={pillar} value={pillar}>{pillar}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="name">Име на категорията:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={values.name}
                                onChange={onChange}
                                required
                                placeholder="Например: Ученически парламент"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Описание (незадължително):</label>
                            <textarea
                                id="description"
                                name="description"
                                value={values.description}
                                onChange={onChange}
                                placeholder="Кратко описание на категорията..."
                                rows="3"
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary">
                                {editingCategory ? 'Обнови' : 'Добави'}
                            </button>
                            <button type="button" className="btn" onClick={handleCancel}>
                                Отказ
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Филтри и действия */}
            <div className="categories-controls">
                <div className="filter-section">
                    <label htmlFor="pillarFilter">Филтрирай по стълб:</label>
                    <select
                        id="pillarFilter"
                        value={selectedPillar}
                        onChange={(e) => setSelectedPillar(e.target.value)}
                    >
                        <option value="all">Всички стълбове</option>
                        {pillars.map(pillar => (
                            <option key={pillar} value={pillar}>{pillar}</option>
                        ))}
                    </select>
                </div>

                {!isAddingCategory && (
                    <button
                        className="btn btn-primary add-category-btn"
                        onClick={() => setIsAddingCategory(true)}
                    >
                        Добави категория
                    </button>
                )}
            </div>

            {/* Списък с категории */}
            <div className="categories-list">
                {Object.entries(getFilteredCategories()).map(([pillar, pillarCategories]) => (
                    <div key={pillar} className="pillar-section">
                        <h3 className="pillar-title">{pillar}</h3>

                        {(!pillarCategories || pillarCategories.length === 0) ? (
                            <p className="no-categories">Няма добавени категории в този стълб.</p>
                        ) : (
                            <div className="categories-grid">
                                {pillarCategories.map(category => (
                                    <div key={category.id} className="category-card">
                                        <div className="category-header">
                                            <h4>{category.name}</h4>
                                            <div className="category-actions">
                                                <button
                                                    className="btn edit-btn"
                                                    onClick={() => handleEditCategory(category)}
                                                    title="Редактирай"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn delete-btn"
                                                    onClick={() => handleDeleteCategory(category.id, category.name)}
                                                    title="Изтрий"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                        {category.description && (
                                            <p className="category-description">{category.description}</p>
                                        )}
                                        <div className="category-meta">
                                            <span className="created-date">
                                                Създадена: {new Date(category.createdAt).toLocaleDateString('bg-BG')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}