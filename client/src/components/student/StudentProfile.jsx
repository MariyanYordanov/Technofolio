import { useContext, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import CreditContext from '../../contexts/CreditContext.jsx';
import * as studentService from "../../services/studentService.js";
import Path from '../../paths.js';

export default function StudentProfile() {
    const { userId, isAuthenticated } = useContext(AuthContext);
    const { getStudentGradeLevel } = useContext(CreditContext);
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStudentProfile = useCallback(async () => {
        try {
            setLoading(true);
            // Директно използваме userId
            const profileData = await studentService.getStudentProfile(userId);

            // Проверяваме дали профилът съществува
            if (profileData && profileData._id) {
                setStudent(profileData);
            } else {
                setStudent(null);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching profile:', err);
            // Ако грешката е 404, значи профилът не съществува
            if (err.status === 404) {
                setStudent(null);
            } else {
                setError('Грешка при зареждане на профила.');
            }
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (isAuthenticated && userId) {
            fetchStudentProfile();
        }
    }, [isAuthenticated, userId, fetchStudentProfile]);

    if (loading) {
        return <div className="loading">Зареждане на профила...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!student) {
        return (
            <div className="profile-not-found">
                <p>Все още нямате попълнен профил.</p>
                <p>Моля, изчакайте администратор да създаде вашия профил.</p>
            </div>
        );
    }

    // Вземаме grade level от CreditContext
    const gradeLevel = getStudentGradeLevel();

    // Извличаме данните от студентския профил
    const studentInfo = student.studentInfo || {};
    const firstName = student.firstName || '';
    const lastName = student.lastName || '';
    const grade = studentInfo.grade || 'N/A';
    const specialization = studentInfo.specialization || 'N/A';
    const averageGrade = studentInfo.averageGrade || 'N/A';
    const imageUrl = student.imageUrl || '/default-avatar.png';

    return (
        <section className="student-profile">
            <div className="profile-header">
                <div className="profile-image">
                    <img
                        src={imageUrl}
                        alt={`${firstName} ${lastName}`}
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                    />
                </div>

                <div className="profile-info">
                    <h1>{firstName} {lastName}</h1>
                    <p className="grade">{grade} клас</p>
                    <p className="specialization">{specialization}</p>
                    <p className="average-grade">Среден успех: {averageGrade}</p>
                    <p className="rating">
                        Рейтинг: <span className={`rating-${gradeLevel.toLowerCase()}`}>{gradeLevel}</span>
                    </p>
                </div>
            </div>

            <div className="profile-actions">
                <Link to={Path.Portfolio} className="btn btn-primary">Портфолио</Link>
                <Link to={Path.Goals} className="btn">Цели</Link>
                <Link to={Path.Credits} className="btn">Кредити</Link>
                <Link to={Path.Interests} className="btn">Интереси</Link>
                <Link to={Path.Achievements} className="btn">Постижения</Link>
                <Link to={Path.Sanctions} className="btn">Забележки</Link>
                <Link to={Path.Events} className="btn">Събития</Link>
            </div>
        </section>
    );
}