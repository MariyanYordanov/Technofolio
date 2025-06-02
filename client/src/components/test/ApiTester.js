// client/src/components/test/ApiTester.jsx
import { useState } from 'react';
import * as authService from '../../services/authService.js';
import * as studentService from '../../services/studentService.js';
import * as teacherService from '../../services/teacherService.js';
import * as creditService from '../../services/creditService.js';
import * as eventService from '../../services/eventService.js';

const TEST_ACCOUNTS = {
    admin: { email: 'admin@technofolio.bg', password: 'Admin123!' },
    teacher: { email: 'teacher1@technofolio.bg', password: 'Teacher123!' },
    student: { email: 'student1@technofolio.bg', password: 'Student123!' }
};

export default function ApiTester() {
    const [results, setResults] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [testing, setTesting] = useState(false);

    const addResult = (type, title, details = null) => {
        setResults(prev => [...prev, { type, title, details, timestamp: new Date() }]);
    };

    const clearResults = () => {
        setResults([]);
    };

    // Test functions
    const testServerConnection = async () => {
        addResult('info', '🔌 Тестване на връзка със сървъра...');
        try {
            const response = await fetch('http://localhost:3030/');
            const data = await response.json();
            addResult('success', '✅ Сървърът работи', data);
            return true;
        } catch (error) {
            addResult('error', '❌ Сървърът не отговаря', { error: error.message });
            return false;
        }
    };

    const testLogin = async (accountType = 'student') => {
        addResult('info', `🔐 Тестване на login с ${accountType} акаунт...`);
        try {
            const credentials = TEST_ACCOUNTS[accountType];
            const result = await authService.login(credentials.email, credentials.password);
            setCurrentUser(result.user);
            addResult('success', `✅ Успешен вход като ${accountType}`, result.user);
            return true;
        } catch (error) {
            addResult('error', `❌ Неуспешен вход като ${accountType}`, { error: error.message });
            return false;
        }
    };

    const testGetProfile = async () => {
        addResult('info', '👤 Тестване на получаване на профил...');
        try {
            const result = await authService.getMe();
            addResult('success', '✅ Профилът е получен успешно', result);
            return true;
        } catch (error) {
            addResult('error', '❌ Грешка при получаване на профил', { error: error.message });
            return false;
        }
    };

    const testStudentEndpoints = async () => {
        if (!currentUser || currentUser.role !== 'student') {
            addResult('info', '⏭️ Пропускане на студентски тестове');
            return;
        }

        addResult('info', '🎓 Тестване на студентски endpoints...');

        // Test student profile
        try {
            const profile = await studentService.getStudentProfile(currentUser._id);
            addResult('success', '✅ Студентски профил получен', profile);
        } catch (error) {
            addResult('error', '❌ Грешка при профил', { error: error.message });
        }

        // Test credits
        try {
            const credits = await creditService.getStudentCredits(currentUser._id);
            addResult('success', '✅ Кредити получени', { count: credits.length });
        } catch (error) {
            addResult('error', '❌ Грешка при кредити', { error: error.message });
        }

        // Test achievements
        try {
            const achievements = await studentService.getStudentAchievements(currentUser._id);
            addResult('success', '✅ Постижения получени', { count: achievements.length });
        } catch (error) {
            addResult('error', '❌ Грешка при постижения', { error: error.message });
        }

        // Test events
        try {
            const events = await eventService.getAllEvents();
            addResult('success', '✅ Събития получени', { count: events.length });
        } catch (error) {
            addResult('error', '❌ Грешка при събития', { error: error.message });
        }
    };

    const testTeacherEndpoints = async () => {
        if (!currentUser || currentUser.role !== 'teacher') {
            addResult('info', '⏭️ Пропускане на учителски тестове');
            return;
        }

        addResult('info', '👨‍🏫 Тестване на учителски endpoints...');

        // Test getting students
        try {
            const students = await teacherService.getAllStudents();
            addResult('success', '✅ Списък с ученици', { count: students.length });
        } catch (error) {
            addResult('error', '❌ Грешка при ученици', { error: error.message });
        }

        // Test pending credits
        try {
            const pending = await teacherService.getPendingCredits();
            addResult('success', '✅ Чакащи кредити', { count: pending.length });
        } catch (error) {
            addResult('error', '❌ Грешка при чакащи кредити', { error: error.message });
        }

        // Test statistics
        try {
            const stats = await teacherService.getStudentsStatistics();
            addResult('success', '✅ Статистики получени', stats);
        } catch (error) {
            addResult('error', '❌ Грешка при статистики', { error: error.message });
        }
    };

    const testLogout = async () => {
        addResult('info', '🚪 Тестване на logout...');
        try {
            await authService.logout();
            setCurrentUser(null);
            addResult('success', '✅ Успешен logout');
            return true;
        } catch (error) {
            addResult('error', '❌ Грешка при logout', { error: error.message });
            return false;
        }
    };

    const runAllTests = async () => {
        setTesting(true);
        clearResults();
        addResult('info', '🚀 Започване на тестовете...');

        // Test server
        const serverOk = await testServerConnection();
        if (!serverOk) {
            addResult('error', '⛔ Спиране - сървърът не работи');
            setTesting(false);
            return;
        }

        // Test as student
        await testLogin('student');
        await testGetProfile();
        await testStudentEndpoints();
        await testLogout();

        // Test as teacher  
        await testLogin('teacher');
        await testGetProfile();
        await testTeacherEndpoints();
        await testLogout();

        // Test as admin
        await testLogin('admin');
        await testGetProfile();
        await testLogout();

        addResult('info', '✨ Тестовете завършиха!');
        setTesting(false);
    };

    return (
        <div className="api-tester">
            <h1>API Тестер</h1>

            <div className="controls">
                <button onClick={runAllTests} disabled={testing}>
                    {testing ? 'Тестване...' : 'Стартирай тестове'}
                </button>
                <button onClick={clearResults}>Изчисти резултати</button>
            </div>

            <div className="results">
                {results.map((result, index) => (
                    <div key={index} className={`result ${result.type}`}>
                        <strong>{result.title}</strong>
                        {result.details && (
                            <pre>{JSON.stringify(result.details, null, 2)}</pre>
                        )}
                    </div>
                ))}
            </div>

            <style jsx>{`
                .api-tester {
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .controls {
                    margin: 20px 0;
                    display: flex;
                    gap: 10px;
                }
                .controls button {
                    padding: 10px 20px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .controls button:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                }
                .results {
                    max-height: 600px;
                    overflow-y: auto;
                    border: 1px solid #ddd;
                    padding: 10px;
                    border-radius: 4px;
                    background: #f8f9fa;
                }
                .result {
                    margin: 10px 0;
                    padding: 10px;
                    border-radius: 4px;
                }
                .result.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .result.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                .result.info {
                    background: #d1ecf1;
                    color: #0c5460;
                    border: 1px solid #bee5eb;
                }
                pre {
                    background: white;
                    padding: 5px;
                    border-radius: 3px;
                    overflow-x: auto;
                    margin-top: 5px;
                }
            `}</style>
        </div>
    );
}