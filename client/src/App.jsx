import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { CreditProvider } from "./contexts/CreditContext.jsx";
import { NotificationProvider } from "./contexts/NotificationContext.jsx";
import Path from './paths';
import Home from './components/common/Home.jsx';
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import Notifications from './components/common/Notifications';
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import VerifyRequest from './components/auth/VerifyRequest';
import EmailLogin from './components/auth/EmailLogin';
import ConfirmRegistration from './components/auth/ConfirmRegistration';
import Logout from './components/auth/Logout';
import StudentProfile from './components/student/StudentProfile';
import { initTheme } from './utils/themeUtils';

// Lazy-loaded components
const Portfolio = lazy(() => import('./components/student/Portfolio'));
const Goals = lazy(() => import('./components/student/Goals'));
const CreditSystem = lazy(() => import('./components/student/CreditSystem'));
const InterestsAndHobbies = lazy(() => import('./components/student/InterestsAndHobbies'));
const Achievements = lazy(() => import('./components/student/Achievements'));
const Sanctions = lazy(() => import('./components/student/Sanctions'));
const Events = lazy(() => import('./components/student/Events'));

// Компонент за проверка на автентикация
function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Зареждане...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={Path.Login} />;
  }

  return children;
}

function App() {
  // Инициализиране на тема
  useEffect(() => {
    initTheme();
  }, []);

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <CreditProvider>
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
                    <Route path={Path.Home} element={<Home />} />
                    <Route path={Path.Login} element={<Login />} />
                    <Route path={Path.Register} element={<Register />} />
                    <Route path="/auth/verify-request" element={<VerifyRequest />} />
                    <Route path={Path.EmailLogin} element={<EmailLogin />} />
                    <Route path={Path.ConfirmRegistration} element={<ConfirmRegistration />} />
                    <Route path={Path.Logout} element={<Logout />} />

                    {/* Защитени маршрути */}
                    <Route path={Path.StudentProfile} element={
                      <RequireAuth>
                        <StudentProfile />
                      </RequireAuth>
                    } />
                    <Route path={Path.Portfolio} element={
                      <RequireAuth>
                        <Portfolio />
                      </RequireAuth>
                    } />
                    <Route path={Path.Goals} element={
                      <RequireAuth>
                        <Goals />
                      </RequireAuth>
                    } />
                    <Route path={Path.Credits} element={
                      <RequireAuth>
                        <CreditSystem />
                      </RequireAuth>
                    } />
                    <Route path={Path.Interests} element={
                      <RequireAuth>
                        <InterestsAndHobbies />
                      </RequireAuth>
                    } />
                    <Route path={Path.Achievements} element={
                      <RequireAuth>
                        <Achievements />
                      </RequireAuth>
                    } />
                    <Route path={Path.Sanctions} element={
                      <RequireAuth>
                        <Sanctions />
                      </RequireAuth>
                    } />
                    <Route path={Path.Events} element={
                      <RequireAuth>
                        <Events />
                      </RequireAuth>
                    } />

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
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;