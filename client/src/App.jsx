// Файл: client/src/App.jsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import { CreditProvider } from "./contexts/CreditContext.jsx";
import { NotificationProvider, useNotifications } from "./contexts/NotificationContext.jsx";
import Path from './paths';
import Home from './components/common/Home.jsx';
import EmailLogin from './components/auth/EmailLogin.jsx';
import Header from "./components/common/Header.jsx";
import Footer from "./components/common/Footer.jsx";
import Notifications from './components/common/Notifications.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import AuthGuard from './components/auth/AuthGuard.jsx';
import Login from './components/auth/Login.jsx';
import Register from './components/auth/Register.jsx';
import Logout from './components/auth/Logout.jsx';
import StudentProfile from './components/student/StudentProfile.jsx';
import { initTheme } from './utils/themeUtils.js';

// Зареждане на студентски компоненти
const Portfolio = lazy(() => import('./components/student/Portfolio'));
const Goals = lazy(() => import('./components/student/Goals'));
const CreditSystem = lazy(() => import('./components/student/CreditSystem'));
const InterestsAndHobbies = lazy(() => import('./components/student/InterestsAndHobbies'));
const Achievements = lazy(() => import('./components/student/Achievements'));
const Sanctions = lazy(() => import('./components/student/Sanctions'));
const Events = lazy(() => import('./components/student/Events'));

// Зареждане на учителски компоненти
const TeacherDashboard = lazy(() => import('./components/teacher/TeacherDashboard'));
const TeacherStudents = lazy(() => import('./components/teacher/TeacherStudents'));
const TeacherCredits = lazy(() => import('./components/teacher/TeacherCredits'));
const TeacherEvents = lazy(() => import('./components/teacher/TeacherEvents'));

import ConfirmRegistration from './components/auth/ConfirmRegistration.jsx';

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
              <Route path={Path.Home} element={<Home />} />
              <Route path={Path.Login} element={<Login />} />
              <Route path={Path.Register} element={<Register />} />
              <Route path={Path.EmailLogin} element={<EmailLogin />} />
              <Route path={Path.ConfirmRegistration} element={<ConfirmRegistration />} />

              {/* Защитени маршрути */}
              <Route element={<AuthGuard />}>
                {/* Студентски маршрути */}
                <Route path={Path.StudentProfile} element={<StudentProfile />} />
                <Route path={Path.Portfolio} element={<Portfolio />} />
                <Route path={Path.Goals} element={<Goals />} />
                <Route path={Path.Credits} element={<CreditSystem />} />
                <Route path={Path.Interests} element={<InterestsAndHobbies />} />
                <Route path={Path.Achievements} element={<Achievements />} />
                <Route path={Path.Sanctions} element={<Sanctions />} />
                <Route path={Path.Events} element={<Events />} />

                {/* Учителски маршрути */}
                <Route path={Path.TeacherDashboard} element={<TeacherDashboard />} />
                <Route path={Path.TeacherStudents} element={<TeacherStudents />} />
                <Route path={Path.TeacherStudentCredits} element={<TeacherCredits />} />
                <Route path={Path.TeacherEvents} element={<TeacherEvents />} />

                {/* Общи */}
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