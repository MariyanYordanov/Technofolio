import { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import useForm from '../../hooks/useForm';

export default function Login() {
    const { loginSubmitHandler } = useContext(AuthContext);
    const { values, onChange, onSubmit } = useForm(loginSubmitHandler, {
        email: '',
        password: '',
    });

    return (
        <section className="login-form">
            <div className="form-container">
                <h1>Вход в Технофолио</h1>

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

                    <div className="form-group">
                        <label htmlFor="password">Парола:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={values.password}
                            onChange={onChange}
                            required
                            autoComplete="current-password"
                            placeholder="********"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">Вход</button>
                    </div>
                </form>

                <div className="form-footer">
                    <p>Нямате профил? <Link to="/register">Регистрирайте се</Link></p>
                </div>
            </div>
        </section>
    );
}
