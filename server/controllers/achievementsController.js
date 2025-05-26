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