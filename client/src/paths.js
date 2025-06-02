// client/src/paths.js
const Path = {
    // Публични пътища
    Home: '/',
    Login: '/login',
    Register: '/register',
    EmailLogin: '/login/email',
    ConfirmRegistration: '/register/confirm',
    TestApi: '/test',

    // Общи за логнати
    Logout: '/logout',

    // Студентски пътища
    StudentDashboard: '/dashboard',
    StudentProfile: '/profile',
    Portfolio: '/portfolio',
    Goals: '/goals',
    Credits: '/credits',
    Interests: '/interests',
    Achievements: '/achievements',
    Sanctions: '/sanctions',
    Events: '/events',

    // Учителски пътища
    TeacherDashboard: '/teacher/dashboard',
    TeacherStudents: '/teacher/students',
    TeacherStudentDetails: '/teacher/students/:studentId',
    TeacherStudentCredits: '/teacher/students/:studentId/credits',
    TeacherStudentSanctions: '/teacher/students/:studentId/sanctions',
    TeacherEvents: '/teacher/events',
    TeacherCredits: '/teacher/credits',
    TeacherReports: '/teacher/reports',

    // Админ пътища
    AdminDashboard: '/admin/dashboard',
    AdminUsers: '/admin/users',
    AdminUserDetails: '/admin/users/:userId',
    AdminCreditCategories: '/admin/credit-categories',
    AdminSettings: '/admin/settings',
    AdminReports: '/admin/reports',
    AdminLogs: '/admin/logs',
    AdminBackup: '/admin/backup'
};

export default Path;