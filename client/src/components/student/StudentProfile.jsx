import { useContext, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import CreditContext from '../../contexts/CreditContext';
import * as studentService from "../services/studentService";

import Path from '../../paths';

export default function StudentProfile() {
    const { userId, isAuthenticated } = useContext(AuthContext);
    const { getStudentGradeLevel } = useContext(CreditContext);
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStudentProfile = useCallback(async () => {
        try {
            setLoading(true);
            const profileData = await studentService.getStudentProfile(userId);
            setStudent(profileData);
            setLoading(false);
        } catch (err) {
            console.log(err);
            setError('Грешка при зареждане на профила.');
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchStudentProfile();
        }
    }, [isAuthenticated, fetchStudentProfile]);

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
                <Link to="/profile/create" className="btn create-profile">Създай профил</Link>
            </div>
        );
    }

    const gradeLevel = getStudentGradeLevel();

    return (
        <section className="student-profile">
            <div className="profile-header">
                <div className="profile-image">
                    <img src={student.imageUrl || '/default-avatar.png'} alt={`${student.firstName} ${student.lastName}`} />
                </div>

                <div className="profile-info">
                    <h1>{student.firstName} {student.lastName}</h1>
                    <p className="grade">{student.grade} клас</p>
                    <p className="specialization">{student.specialization}</p>
                    <p className="average-grade">Среден успех: {student.averageGrade}</p>
                    <p className="rating">Рейтинг: <span className={`rating-${gradeLevel.toLowerCase()}`}>{gradeLevel}</span></p>
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
