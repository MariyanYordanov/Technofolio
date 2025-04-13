import { Link } from 'react-router-dom';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="footer-content">
                <div className="footer-logo">
                    <h2>Технофолио</h2>
                    <p>Платформа за проследяване на развитието на учениците в БУДИТЕЛ</p>
                </div>

                <div className="footer-links">
                    <h3>Полезни връзки</h3>
                    <ul>
                        <li>
                            <a href="https://buditel.bg" target="_blank" rel="noopener noreferrer">
                                БУДИТЕЛ
                            </a>
                        </li>
                        <li>
                            <a href="https://schoolo.bg" target="_blank" rel="noopener noreferrer">
                                Школо
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="footer-contact">
                    <h3>Контакти</h3>
                    <address>
                        <p>БУДИТЕЛ</p>
                        <p>гр. София</p>
                        <p>Email: info@buditel.bg</p>
                    </address>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {currentYear} Технофолио. Всички права запазени.</p>
            </div>
        </footer>
    );
}