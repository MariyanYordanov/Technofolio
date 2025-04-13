import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import useForm from '../hooks/useForm';

export default function Register() {
    const { registerSubmitHandler } = useContext(AuthContext);
    const [passwordError, setPasswordError] = useState('');

    const { values, onChange, onSubmit } = useForm((formValues) => {
        if (formValues.password !== formValues.rePassword) {
            setPasswordError('Паролите не съвпадат!');
            return;
        }

        setPasswordError('');
        registerSubmitHandler(formValues);
    }, {
        email: '',
        password: '',
        rePassword: '',
        firstName: '',
        lastName: '',
        grade: '',
        specialization: '',
    });

    const grades = ['8', '9', '10', '11', '12'];
    const specializations = [
        'Софтуерни и хардуерни науки',
        'Интериорен дизайн',
        'Графичен дизайн',
        'Природни науки',
        'Предприемачество'
    ];

    return (
        <section className="register-form">
            <div className="form-container">
                <h1>Регистрация в Технофолио</h1>

                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Имейл:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={values.email}
                            onChange={onChange}
                            required
                            autoComplete="email"
                            placeholder="example@buditel.bg"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">Име:</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={values.firstName}
                                onChange={onChange}
                                required
                                placeholder="Иван"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="lastName">Фамилия:</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={values.lastName}
                                onChange={onChange}
                                required
                                placeholder="Иванов"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="grade">Клас:</label>
                            <select
                                id="grade"
                                name="grade"
                                value={values.grade}
                                onChange={onChange}
                                required
                            >
                                <option value="">Избери клас</option>
                                {grades.map(grade => (
                                    <option key={grade} value={grade}>
                                        {grade} клас
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="specialization">Специалност:</label>
                            <select
                                id="specialization"
                                name="specialization"
                                value={values.specialization}
                                onChange={onChange}
                                required
                            >
                                <option value="">Избери специалност</option>
                                {specializations.map(spec => (
                                    <option key={spec} value={spec}>
                                        {spec}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Парола:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={values.password}
                            onChange={onChange}
                            required
                            autoComplete="new-password"
                            placeholder="********"
                            minLength="6"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="rePassword">Повтори парола:</label>
                        <input
                            type="password"
                            id="rePassword"
                            name="rePassword"
                            value={values.rePassword}
                            onChange={onChange}
                            required
                            autoComplete="new-password"
                            placeholder="********"
                        />
                        {passwordError && <span className="error-message">{passwordError}</span>}
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">Регистрация</button>
                    </div>
                </form>

                <div className="form-footer">
                    <p>Вече имате профил? <Link to="/login">Вход</Link></p>
                </div>
            </div>
        </section>
    );
}