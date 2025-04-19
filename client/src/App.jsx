// src/App.jsx

import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { CreditProvider } from "./contexts/CreditContext.jsx";
import { NotificationProvider, useNotifications } from "./contexts/NotificationContext.jsx";
import Path from './paths';

// Общи компоненти
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import Notifications from './components/common/Notifications';
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthGuard from './components/auth/AuthGuard';

// Компоненти за автентикация
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Logout from './components/auth/Logout';

// Основни компоненти (зареждат се веднага)
import StudentProfile from './components/student/StudentProfile';

// Компоненти, които се зареждат с lazy loading за оптимизация
const Portfolio = lazy(() => import('./components/student/Portfolio'));
const Goals = lazy(() => import('./components/student/Goals'));
const CreditSystem = lazy(() => import('./components/student/CreditSystem'));
const InterestsAndHobbies = lazy(() => import('./components/student/InterestsAndHobbies'));
const Achievements = lazy(() => import('./components/student/Achievements'));
const Sanctions = lazy(() => import('./components/student/Sanctions'));
const Events = lazy(() => import('./components/student/Events'));

// Зареждане на тема при стартиране
import { initTheme } from './utils/themeUtils';

// Компонент, който осигурява правилното подаване на props
function AppWithNotifications() {
  const notificationService = useNotifications();
  
  return (
    <AuthProvider notificationService={notificationService}>
      <AppWithAuth />
    </AuthProvider>
  );
}

// Компонент, който предоставя authService на CreditProvider
function AppWithAuth() {
  const auth = useAuth();
  const notifications = useNotifications();
  
  return (
    <CreditProvider
      authService={auth}
      notificationService={notifications}
    >
      <div id="app-container">
        <Header />
        <main className="content-container">
          <Notifications />
          <Suspense fallback={
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Зареждане...</p>
            </div>
          }>
            <Routes>
              {/* Публични маршрути */}
              <Route path={Path.Home} element={<StudentProfile />} />
              <Route path={Path.Login} element={<Login />} />
              <Route path={Path.Register} element={<Register />} />

              {/* Защитени маршрути */}
              <Route element={<AuthGuard />}>
                <Route path={Path.StudentProfile} element={<StudentProfile />} />
                <Route path={Path.Portfolio} element={<Portfolio />} />
                <Route path={Path.Goals} element={<Goals />} />
                <Route path={Path.Credits} element={<CreditSystem />} />
                <Route path={Path.Interests} element={<InterestsAndHobbies />} />
                <Route path={Path.Achievements} element={<Achievements />} />
                <Route path={Path.Sanctions} element={<Sanctions />} />
                <Route path={Path.Events} element={<Events />} />
                <Route path={Path.Logout} element={<Logout />} />
              </Route>

              {/* Маршрут за несъществуващи страници */}
              <Route path="*" element={
                <div className="not-found">
                  <h1>404</h1>
                  <p>Страницата не е намерена</p>
                </div>
              } />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </CreditProvider>
  );
}

function App() {
  // Инициализиране на тема
  initTheme();

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AppWithNotifications />
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;