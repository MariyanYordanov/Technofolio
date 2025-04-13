import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CreditProvider } from './contexts/CreditContext';
import Path from './paths';
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import StudentProfile from './components/student/StudentProfile';
import ErrorBoundary from './components/common/ErrorBoundary';
import AuthGuard from './components/auth/AuthGuard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Logout from './components/auth/Logout';

// Lazy-loading за по-тежките компоненти
const Portfolio = lazy(() => import('./components/student/Portfolio'));
const Goals = lazy(() => import('./components/student/Goals'));
const CreditSystem = lazy(() => import('./components/student/CreditSystem'));
const InterestsAndHobbies = lazy(() => import('./components/student/InterestsAndHobbies'));
const Achievements = lazy(() => import('./components/student/Achievements'));
const Sanctions = lazy(() => import('./components/student/Sanctions'));
const Events = lazy(() => import('./components/student/Events'));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CreditProvider>
          <div id="app-container">
            <Header />
            <main className="content-container">
              <Suspense fallback={<div className="loading">Зареждане...</div>}>
                <Routes>
                  <Route path={Path.Home} element={<StudentProfile />} />
                  <Route path={Path.Login} element={<Login />} />
                  <Route path={Path.Register} element={<Register />} />

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
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </CreditProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;