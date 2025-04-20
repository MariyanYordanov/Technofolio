// src/components/Home.jsx
export default function Home() {
    return (
      <section className="home-page">
        <div className="hero-section">
          <h1>Добре дошли в Технофолио</h1>
          <p className="subtitle">Платформа за проследяване на развитието на учениците в БУДИТЕЛ</p>
        </div>
  
        <div className="features-section">
          <h2>Какво предлага Технофолио?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <h3>Портфолио</h3>
              <p>Създайте и поддържайте дигитално портфолио с вашите постижения и проекти.</p>
            </div>
            
            <div className="feature-card">
              <h3>Кредитна система</h3>
              <p>Проследявайте своето развитие чрез иновативна кредитна система, разпределена в три основни стълба.</p>
            </div>
            
            <div className="feature-card">
              <h3>Цели и постижения</h3>
              <p>Задайте конкретни цели за вашето развитие и отбелязвайте постиженията си.</p>
            </div>
            
            <div className="feature-card">
              <h3>Събития</h3>
              <p>Участвайте в учебни и извънкласни събития, организирани от училището.</p>
            </div>
          </div>
        </div>
        
        <div className="system-description">
          <h2>Технологични характеристики</h2>
          <ul>
            <li>Съвременен дизайн, съобразен с нуждите на учебния процес</li>
            <li>Сигурна автентикация чрез имейл</li>
            <li>Възможност за проследяване на напредъка през учебните години</li>
            <li>Интеграция с училищната система</li>
          </ul>
        </div>
      </section>
    );
  }