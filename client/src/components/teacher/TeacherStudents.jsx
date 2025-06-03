// client/src/components/teacher/TeacherStudents.jsx
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import * as teacherService from '../../services/teacherService.js';

export default function TeacherStudents() {
    const { isAuthenticated, isTeacher } = useContext(AuthContext);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                if (!isAuthenticated || !isTeacher) {
                    setError('Нямате права за достъп до тази страница.');
                    setLoading(false);
                    return;
                }

                setLoading(true);
                const studentsData = await teacherService.getAllStudents();
                setStudents(studentsData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching students:', err);
                setError('Грешка при зареждане на учениците.');
                setLoading(false);
            }
        };

        fetchStudents();
    }, [isAuthenticated, isTeacher]);

    if (loading) {
        return <div className="loading">Зареждане на ученици...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <section className="teacher-students-view">
            <h1>Моите ученици</h1>

            {students.length === 0 ? (
                <p className="no-data">Няма намерени ученици.</p>
            ) : (
                <div className="students-container">
                    {students.map(student => (
                        <div key={student.id} className="student-card">
                            <div className="student-header">
                                <h2>{student.firstName} {student.lastName}</h2>
                                <span className="student-grade">{student.grade} клас</span>
                            </div>
                            <div className="student-content">
                                <p className="student-specialization">{student.specialization}</p>
                                <p className="student-average">Среден успех: {student.averageGrade || 'Няма данни'}</p>
                            </div>
                            <div className="student-actions">
                                <Link to={`/teacher/students/${student.id}/profile`} className="btn">
                                    Преглед на профил
                                </Link>
                                <Link to={`/teacher/students/${student.id}/credits`} className="btn">
                                    Кредити
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}