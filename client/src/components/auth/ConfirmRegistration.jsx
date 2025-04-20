// src/components/auth/ConfirmRegistration.jsx
import { useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import Path from '../../paths';

export default function ConfirmRegistration() {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirmRegistration } = useContext(AuthContext);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (token) {
      confirmRegistration(token);
    } else {
      navigate(Path.Register);
    }
  }, [location, confirmRegistration, navigate]);

  // Показваме loading докато обработваме потвърждението
  return (
    <div className="email-login-page">
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Потвърждаване на регистрацията...</p>
      </div>
    </div>
  );
}