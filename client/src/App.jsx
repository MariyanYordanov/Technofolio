// client/src/App.jsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from "./contexts/AuthContext.jsx";
import useAuth from "./hooks/useAuth.js";
import { CreditProvider } from "./contexts/CreditContext.jsx";
import NotificationProvider from './components/common/NotificationProvider.jsx';
import useNotifications from './hooks/useNotifications.js';
import Notifications from './components/common/Notifications.jsx';
import Path from './paths.js';
import Home from './components/common/Home.jsx';
import EmailLogin from './components/auth/EmailLogin.jsx';
import Header from "./components/common/Header.jsx";
import Footer from "./components/common/Footer.jsx";
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import AuthGuard from './components/auth/AuthGuard.jsx';
import Login from './components/auth/Login.jsx';
import Register from './components/auth/Register.jsx';
import Logout from './components/auth/Logout.jsx';
import StudentProfile from './components/student/StudentProfile.jsx';
import { initTheme } from './utils/themeUtils.js';
import ConfirmRegistration from './components/auth/ConfirmRegistration.jsx';

// Зареждане на ученически компоненти
const Portfolio = lazy(() => import('./components/student/Portfolio.jsx'));
const Goals = lazy(() => import('./components/student/Goals.jsx'));
const CreditSystem = lazy(() => import('./components/student/CreditSystem.jsx'));
const InterestsAndHobbies = lazy(() => import('./components/student/InterestsAndHobbies.jsx'));
const Achievements = lazy(() => import('./components/student/Achievements.jsx'));
const Sanctions = lazy(() => import('./components/student/Sanctions.jsx'));
const Events = lazy(() => import('./components/student/Events.jsx'));

// Зареждане на учителски компоненти
const TeacherDashboard = lazy(() => import('./components/teacher/TeacherDashboard.jsx'));
const TeacherStudents = lazy(() => import('./components/teacher/TeacherStudents.jsx'));
const TeacherStudentDetails = lazy(() => import('./components/teacher/TeacherStudentDetails.jsx'));
const TeacherCredits = lazy(() => import('./components/teacher/TeacherCreditsManagement.jsx'));
const TeacherEvents = lazy(() => import('./components/teacher/TeacherEvents.jsx'));
const TeacherSanctions = lazy(() => import('./components/teacher/TeacherSanctions.jsx'));
const TeacherReports = lazy(() => import('./components/teacher/TeacherReports.jsx'));
const ApiTester = lazy(() => import('./components/test/ApiTester.jsx'));


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
              <Route path="/test" element={<ApiTester />} />
              {/* Защитени маршрути */}
              <Route element={<AuthGuard />}>
                {/* Ученически маршрути */}
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
                <Route path={Path.TeacherStudentDetails} element={<TeacherStudentDetails />} />
                <Route path={Path.TeacherStudentCredits} element={<TeacherCredits />} />
                <Route path={Path.TeacherStudentSanctions} element={<TeacherSanctions />} />
                <Route path={Path.TeacherEvents} element={<TeacherEvents />} />
                <Route path={Path.TeacherCredits} element={<TeacherCredits />} />
                <Route path={Path.TeacherReports} element={<TeacherReports />} />

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