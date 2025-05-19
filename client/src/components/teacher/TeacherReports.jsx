
// client/src/components/teacher/TeacherReports.jsx
import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import * as teacherService from '../../services/teacherService.js';
import { useNotifications } from '../../contexts/NotificationContext.jsx';

export default function TeacherReports() {
    const { isAuthenticated, isTeacher } = useContext(AuthContext);
    const { success, error: showError } = useNotifications();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportType, setReportType] = useState('credits');
    const [reportParams, setReportParams] = useState({
        grade: queryParams.get('grade') || '',
        specialization: queryParams.get('specialization') || '',
        pillar: '',
        startDate: '',
        endDate: ''
    });
    const [reportData, setReportData] = useState(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    const grades = ['8', '9', '10', '11', '12'];
    const specializations = [
        'Софтуерни и хардуерни науки',
        'Интериорен дизайн',
        'Графичен дизайн',
        'Природни науки',
        'Предприемачество'
    ];
    const pillars = ['Аз и другите', 'Мислене', 'Професия'];
    const reportTypes = [
        { id: 'credits', name: 'Кредити по клас' },
        { id: 'students', name: 'Ученически профили' },
        { id: 'events', name: 'Участие в събития' },
        { id: 'achievements', name: 'Постижения на учениците' },
        { id: 'sanctions', name: 'Санкции и отсъствия' }
    ];

    useEffect(() => {
        if (!isAuthenticated || !isTeacher) {
            navigate('/login');
        }
    }, [isAuthenticated, isTeacher, navigate]);

    // Функция за генериране на отчет
    const generateReport = useCallback(async () => {
        if (!reportParams.grade && !reportParams.specialization) {
            showError('Моля, изберете поне клас или специалност за генериране на отчет.');
            return;
        }

        try {
            setLoading(true);
            setIsGeneratingReport(true);
            let data;

            switch (reportType) {
                case 'credits':
                    data = await teacherService.generateCreditsReport(reportParams);
                    break;
                case 'students':
                    data = await teacherService.generateStudentsReport(reportParams);
                    break;
                case 'events':
                    data = await teacherService.generateEventsReport(reportParams);
                    break;
                case 'achievements':
                    data = await teacherService.generateAchievementsReport(reportParams);
                    break;
                case 'sanctions':
                    data = await teacherService.generateSanctionsReport(reportParams);
                    break;
                default:
                    throw new Error('Невалиден тип отчет.');
            }

            setReportData(data);
            success('Отчетът е генериран успешно!');
        } catch (err) {
            console.error('Error generating report:', err);
            setError(err.message || 'Грешка при генериране на отчета.');
            showError(err.message || 'Грешка при генериране на отчета.');
        } finally {
            setLoading(false);
        }
    }, [reportType, reportParams, showError, success]);

    // Функция за експортиране на отчет
    const exportReport = useCallback(async (format) => {
        if (!reportData) {
            showError('Няма генериран отчет за експортиране.');
            return;
        }

        try {
            setLoading(true);
            await teacherService.exportReport(reportType, reportParams, format);
            success(`Отчетът е експортиран успешно в ${format.toUpperCase()} формат!`);
            setLoading(false);
        } catch (err) {
            console.error('Error exporting report:', err);
            showError(err.message || 'Грешка при експортиране на отчета.');
            setLoading(false);
        }
    }, [reportData, reportType, reportParams, showError, success]);

    // Обработка на промяна в параметрите на отчета
    const handleParamChange = (e) => {
        const { name, value } = e.target;
        setReportParams(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Обработка на промяна в типа на отчета
    const handleReportTypeChange = (type) => {
        setReportType(type);
        setReportData(null);
    };

    if (loading && !isGeneratingReport) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <p>Зареждане...</p>
            </div>
        );
    }

    if (error && !isGeneratingReport) {
        return <div className="error">{error}</div>;
    }

    return (
        <section className="teacher-reports">
            <div className="page-header">
                <h1>Генериране на отчети</h1>
            </div>

            <div className="report-types">
                <h2>Избор на тип отчет</h2>
                <div className="report-types-grid">
                    {reportTypes.map(type => (
                        <div
                            key={type.id}
                            className={`report-type-card ${reportType === type.id ? 'active' : ''}`}
                            onClick={() => handleReportTypeChange(type.id)}
                        >
                            <h3>{type.name}</h3>
                        </div>
                    ))}
                </div>
            </div>

            <div className="report-parameters">
                <h2>Параметри на отчета</h2>
                <div className="parameters-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="grade">Клас:</label>
                            <select
                                id="grade"
                                name="grade"
                                value={reportParams.grade}
                                onChange={handleParamChange}
                            >
                                <option value="">Всички класове</option>
                                {grades.map(grade => (
                                    <option key={grade} value={grade}>{grade} клас</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="specialization">Специалност:</label>
                            <select
                                id="specialization"
                                name="specialization"
                                value={reportParams.specialization}
                                onChange={handleParamChange}
                            >
                                <option value="">Всички специалности</option>
                                {specializations.map(spec => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {(reportType === 'credits' || reportType === 'achievements') && (
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="pillar">Стълб (само за кредити):</label>
                                <select
                                    id="pillar"
                                    name="pillar"
                                    value={reportParams.pillar}
                                    onChange={handleParamChange}
                                    disabled={reportType !== 'credits'}
                                >
                                    <option value="">Всички стълбове</option>
                                    {pillars.map(pillar => (
                                        <option key={pillar} value={pillar}>{pillar}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="startDate">Начална дата:</label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                value={reportParams.startDate}
                                onChange={handleParamChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="endDate">Крайна дата:</label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                value={reportParams.endDate}
                                onChange={handleParamChange}
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            onClick={generateReport}
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading && isGeneratingReport ? 'Генериране...' : 'Генерирай отчет'}
                        </button>
                    </div>
                </div>
            </div>

            {reportData && (
                <div className="report-results">
                    <div className="results-header">
                        <h2>Резултати</h2>
                        <div className="export-actions">
                            <button
                                onClick={() => exportReport('pdf')}
                                className="btn export-btn"
                                disabled={loading}
                            >
                                Експорт в PDF
                            </button>
                            <button
                                onClick={() => exportReport('excel')}
                                className="btn export-btn"
                                disabled={loading}
                            >
                                Експорт в Excel
                            </button>
                        </div>
                    </div>

                    {/* Визуализация на отчет за кредити */}
                    {reportType === 'credits' && (
                        <div className="credits-report">
                            <div className="report-summary">
                                <div className="summary-card">
                                    <div className="summary-value">{reportData.totalCredits}</div>
                                    <div className="summary-label">Общо кредити</div>
                                </div>
                                <div className="summary-card">
                                    <div className="summary-value">{reportData.validatedCredits}</div>
                                    <div className="summary-label">Одобрени кредити</div>
                                </div>
                                <div className="summary-card">
                                    <div className="summary-value">{reportData.pendingCredits}</div>
                                    <div className="summary-label">Чакащи кредити</div>
                                </div>
                                <div className="summary-card">
                                    <div className="summary-value">{reportData.rejectedCredits}</div>
                                    <div className="summary-label">Отхвърлени кредити</div>
                                </div>
                            </div>

                            <div className="credits-distribution">
                                <h3>Разпределение по стълбове</h3>
                                <div className="distribution-grid">
                                    {reportData.pillarDistribution && Object.entries(reportData.pillarDistribution).map(([pillar, count]) => (
                                        <div key={pillar} className="pillar-card">
                                            <div className="pillar-name">{pillar}</div>
                                            <div className="pillar-count">{count} кредита</div>
                                            <div className="pillar-percentage">
                                                {Math.round((count / reportData.validatedCredits) * 100)}% от всички одобрени
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {reportData.studentsWithMostCredits && reportData.studentsWithMostCredits.length > 0 && (
                                <div className="top-students">
                                    <h3>Ученици с най-много кредити</h3>
                                    <div className="students-table">
                                        <div className="table-header">
                                            <div className="column">Ученик</div>
                                            <div className="column">Клас</div>
                                            <div className="column">Специалност</div>
                                            <div className="column">Кредити</div>
                                        </div>
                                        {reportData.studentsWithMostCredits.map((student, index) => (
                                            <div key={index} className="table-row">
                                                <div className="column">{student.firstName} {student.lastName}</div>
                                                <div className="column">{student.grade}</div>
                                                <div className="column">{student.specialization}</div>
                                                <div className="column">{student.validatedCredits}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Визуализация на отчет за ученици */}
                    {reportType === 'students' && (
                        <div className="students-report">
                            <div className="report-summary">
                                <div className="summary-card">
                                    <div className="summary-value">{reportData.totalStudents}</div>
                                    <div className="summary-label">Общо ученици</div>
                                </div>
                                {reportData.gradeDistribution && Object.entries(reportData.gradeDistribution).map(([grade, count]) => (
                                    <div key={grade} className="summary-card">
                                        <div className="summary-value">{count}</div>
                                        <div className="summary-label">{grade} клас</div>
                                    </div>
                                ))}
                            </div>

                            <div className="students-list">
                                <h3>Списък с ученици</h3>
                                <div className="students-table">
                                    <div className="table-header">
                                        <div className="column">Име</div>
                                        <div className="column">Клас</div>
                                        <div className="column">Специалност</div>
                                        <div className="column">Имейл</div>
                                        <div className="column">Статус</div>
                                    </div>
                                    {reportData.students && reportData.students.map((student, index) => (
                                        <div key={index} className="table-row">
                                            <div className="column">{student.firstName} {student.lastName}</div>
                                            <div className="column">{student.grade}</div>
                                            <div className="column">{student.specialization}</div>
                                            <div className="column">{student.email}</div>
                                            <div className="column">{student.status}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Тук могат да се добавят визуализации за другите типове отчети */}
                </div>
            )}
        </section>
    );
}