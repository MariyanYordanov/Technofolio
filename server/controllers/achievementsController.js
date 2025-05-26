// Получаване на всички постижения (за учители и админи)
export const getAllAchievements = catchAsync(async (req, res, next) => {
    const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        grade: req.query.grade,
        category: req.query.category,
        search: req.query.search,
        startDate: req.query.startDate,
        endDate: req.query.endDate
    };

    const result = await achievementsService.getAllAchievements(filters, req.user.role);

    res.status(200).json({
        success: true,
        ...result.pagination,
        achievements: result.achievements
    });
});

// Получаване на статистики за постижения
export const getAchievementsStatistics = catchAsync(async (req, res, next) => {
    const filters = {
        grade: req.query.grade,
        startDate: req.query.startDate,
        endDate: req.query.endDate
    };

    const stats = await achievementsService.getAchievementsStatistics(filters, req.user.role);

    res.status(200).json({
        success: true,
        stats
    });
});

// Експортиране на постижения за отчет
export const exportAchievementsData = catchAsync(async (req, res, next) => {
    const filters = {
        grade: req.query.grade,
        category: req.query.category,
        startDate: req.query.startDate,
        endDate: req.query.endDate
    };

    const data = await achievementsService.exportAchievementsData(filters, req.user.role);

    res.status(200).json({
        success: true,
        count: data.length,
        filters,
        data
    });
});



// ========== ДОБАВКИ КЪМ portfolioController.js ==========

// Добави тези методи в края на portfolioController.js:

// Получаване на всички портфолия (за учители и админи)
export const getAllPortfolios = catchAsync(async (req, res, next) => {
    const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        grade: req.query.grade,
        search: req.query.search,
        hasMentor: req.query.hasMentor
    };

    const result = await portfolioService.getAllPortfolios(filters, req.user.role);

    res.status(200).json({
        success: true,
        ...result.pagination,
        portfolios: result.portfolios
    });
});

// Получаване на статистики за портфолия
export const getPortfoliosStatistics = catchAsync(async (req, res, next) => {
    const stats = await portfolioService.getPortfoliosStatistics(req.user.role);

    res.status(200).json({
        success: true,
        stats
    });
});

// ========== ДОБАВКИ КЪМ studentController.js ==========

// Добави тези методи в края на studentController.js:

// Получаване на всички ученици (за учители и админи)
export const getAllStudents = catchAsync(async (req, res, next) => {
    const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        grade: req.query.grade,
        specialization: req.query.specialization,
        search: req.query.search
    };

    const result = await studentService.getAllStudents(filters, req.user.role);

    res.status(200).json({
        success: true,
        ...result.pagination,
        students: result.students
    });
});

// Получаване на статистики за ученици
export const getStudentsStatistics = catchAsync(async (req, res, next) => {
    const stats = await studentService.getStudentsStatistics(req.user.role);

    res.status(200).json({
        success: true,
        stats
    });
});

// Търсене на ученици
export const searchStudents = catchAsync(async (req, res, next) => {
    const searchCriteria = {
        query: req.query.q,
        grade: req.query.grade,
        minAverageGrade: req.query.minGrade ? parseFloat(req.query.minGrade) : undefined,
        maxAverageGrade: req.query.maxGrade ? parseFloat(req.query.maxGrade) : undefined
    };

    const students = await studentService.searchStudents(searchCriteria, req.user.role);

    res.status(200).json({
        success: true,
        count: students.length,
        students
    });
});