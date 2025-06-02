// client/src/components/auth/Login.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import useNotifications from "../../hooks/useNotifications.js";
import useForm from '../../hooks/useForm.js';

export default function Login() {
  const { loginSubmitHandler, isLoading } = useAuth();
  const { error } = useNotifications();
  const [formError, setFormError] = useState('');
  const [isEmailLogin, setIsEmailLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { values, onChange, onSubmit } = useForm(async (formValues) => {
    try {
      setFormError('');
      if (isEmailLogin) {
        // Режим за изпращане на линк за вход
        await loginSubmitHandler({ email: formValues.email });
      } else {
        // Стандартен вход с имейл и парола
        await loginSubmitHandler(formValues);
      }
    } catch (err) {
      console.error('Login error:', err);
      setFormError(err.message || 'Възникна грешка при вход в системата');
      error(err.message || 'Възникна грешка при вход в системата');
    }
  }, {
    email: '',
    password: '',
  });

  return (
    <section className="login-form">
      <div className="form-container">
        <h1>Вход в Технофолио</h1>

        {formError && <div className="error-message form-error">{formError}</div>}

        <div className="auth-toggle">
          <button
            className={!isEmailLogin ? 'active' : ''}
            onClick={() => setIsEmailLogin(false)}
            type="button"
          >
            С парола
          </button>
          <button
            className={isEmailLogin ? 'active' : ''}
            onClick={() => setIsEmailLogin(true)}
            type="button"
          >
            С имейл линк
          </button>
        </div>

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
              disabled={isLoading}
            />
          </div>

          {!isEmailLogin && (
            <div className="form-group password-group">
              <label htmlFor="password">Парола:</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={values.password}
                  onChange={onChange}
                  required
                  autoComplete="current-password"
                  placeholder="********"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-full-width"
              disabled={isLoading}
            >
              {isLoading ? 'Обработка...' : isEmailLogin ? 'Изпрати линк за вход' : 'Вход'}
            </button>
          </div>
        </form>

        <div className="form-footer">
          <p>Нямате профил? <Link to="/register">Регистрирайте се</Link></p>
        </div>
      </div>
    </section>
  );
}