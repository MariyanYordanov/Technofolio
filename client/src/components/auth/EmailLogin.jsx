// src/components/auth/EmailLogin.jsx
import { useContext, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import Path from '../../paths';

export default function EmailLogin() {
  const location = useLocation();
  const { handleEmailLogin } = useContext(AuthContext);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (token) {
      handleEmailLogin(token);
    }
  }, [location, handleEmailLogin]);

  // Докато обработваме автентикацията, покажи loading екран
  return (
    <div className="email-login-page">
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Влизане в системата...</p>
      </div>
    </div>
  );
}