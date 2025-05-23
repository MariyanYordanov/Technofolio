const Path = {
    Home: '/',
    Login: '/login',
    Register: '/register',
    Logout: '/logout',
    StudentProfile: '/profile',
    Portfolio: '/portfolio',
    Goals: '/goals',
    Credits: '/credits',
    Interests: '/interests',
    Achievements: '/achievements',
    Sanctions: '/sanctions',
    Events: '/events',
    EmailLogin: '/login/email',
    ConfirmRegistration: '/register/confirm',
    // Учителски пътища
    TeacherDashboard: '/teacher/dashboard',
    TeacherStudents: '/teacher/students',
    TeacherStudentDetails: '/teacher/students/:studentId/profile',
    TeacherStudentCredits: '/teacher/students/:studentId/credits',
    TeacherStudentSanctions: '/teacher/students/:studentId/sanctions',
    TeacherEvents: '/teacher/events',
    TeacherCredits: '/teacher/credits',
    TeacherReports: '/teacher/reports',
};

export default Path;