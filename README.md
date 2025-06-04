
# Технофолио - Клиентска част

Платформа за проследяване на развитието на учениците в училище БУДИТЕЛ. Системата предоставя функционалности за управление на кредити, портфолио, постижения, събития и цели на учениците.

## Технологичен стек

- **React 18.2.0** - UI библиотека
- **React Router DOM 6.18.0** - Routing
- **Vite** - Build tool
- **CSS** - Стилизиране (модулна архитектура)
- **JavaScript ES6+** - Програмен език

## Файлова структура

```
client/
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
│
├── src/
│   ├── main.jsx                          # Входна точка на приложението
│   ├── App.jsx                           # Основен компонент с routing логика
│   ├── paths.js                          # Централизирани пътища за routing
│   │
│   ├── components/                       # React компоненти
│   │   ├── common/                       # Общи компоненти
│   │   │   ├── ErrorBoundary.jsx         # Компонент за прихващане на грешки
│   │   │   ├── Footer.jsx                # Footer на приложението
│   │   │   ├── Header.jsx                # Header с навигация
│   │   │   ├── Home.jsx                  # Начална страница
│   │   │   ├── NotificationProvider.jsx  # Context provider за нотификации
│   │   │   ├── Notifications.jsx         # Компонент за показване на нотификации
│   │   │   └── ThemeToggle.jsx           # Бутон за смяна на тема (светла/тъмна)
│   │   │
│   │   ├── auth/                         # Компоненти за автентикация
│   │   │   ├── AuthGuard.jsx             # Protected route wrapper
│   │   │   ├── ConfirmRegistration.jsx   # Потвърждаване на регистрация
│   │   │   ├── EmailLogin.jsx            # Вход с email линк
│   │   │   ├── Login.jsx                 # Форма за вход
│   │   │   ├── Logout.jsx                # Компонент за изход
│   │   │   └── Register.jsx              # Форма за регистрация
│   │   │
│   │   ├── student/                      # Ученически компоненти
│   │   │   ├── Achievements.jsx          # Управление на постижения
│   │   │   ├── CreditSystem.jsx          # Кредитна система
│   │   │   ├── Events.jsx                # Събития и регистрации
│   │   │   ├── Goals.jsx                 # Цели на ученика
│   │   │   ├── InterestsAndHobbies.jsx   # Интереси и хобита
│   │   │   ├── Portfolio.jsx             # Портфолио
│   │   │   ├── Sanctions.jsx             # Санкции и отсъствия
│   │   │   ├── StudentDashboard.jsx      # Табло на ученика
│   │   │   └── StudentProfile.jsx        # Профил на ученика
│   │   │
│   │   ├── teacher/                      # Учителски компоненти
│   │   │   ├── TeacherCreditsManagement.jsx  # Управление на кредити
│   │   │   ├── TeacherDashboard.jsx          # Табло на учителя
│   │   │   ├── TeacherEvents.jsx             # Управление на събития
│   │   │   ├── TeacherReports.jsx            # Генериране на отчети
│   │   │   ├── TeacherSanctions.jsx          # Управление на санкции
│   │   │   ├── TeacherStudentDetails.jsx     # Детайли за ученик
│   │   │   └── TeacherStudents.jsx           # Списък с ученици
│   │   │
│   │   └── admin/                        # Административни компоненти
│   │       ├── AdminCreditCategories.jsx # Управление на категории кредити
│   │       └── AdminDashboard.jsx        # Административно табло
│   │
│   ├── contexts/                         # React Contexts
│   │   ├── AuthContext.jsx               # Context за автентикация
│   │   ├── CreditContext.jsx             # Context за кредитна система
│   │   └── NotificationContext.jsx       # Context за нотификации
│   │
│   ├── hooks/                            # Custom React hooks
│   │   ├── useAuth.js                    # Hook за достъп до AuthContext
│   │   ├── useForm.js                    # Hook за управление на форми
│   │   ├── useNotifications.js           # Hook за нотификации
│   │   └── usePersistedState.js          # Hook за localStorage state
│   │
│   ├── services/                         # API services
│   │   ├── adminService.js               # Административни API заявки
│   │   ├── authService.js                # Автентикационни API заявки
│   │   ├── creditService.js              # API за кредити
│   │   ├── eventService.js               # API за събития
│   │   ├── studentService.js             # API за ученически данни
│   │   └── teacherService.js             # API за учителски функции
│   │
│   └── utils/                            # Utility функции
│       ├── pathUtils.js                  # Помощни функции за пътища
│       ├── requestUtils.js               # HTTP request wrapper
│       └── themeUtils.js                 # Функции за темата
│
└── styles/                               # CSS файлове
    ├── main.css                          # Главен CSS файл (импортва всички)
    │
    ├── base/                             # Базови стилове
    │   ├── _reset.css                    # CSS reset и глобални стилове
    │   ├── _utilities.css                # Utility класове и responsive
    │   └── _variables.css                # CSS променливи
    │
    ├── components/                       # Стилове за компоненти
    │   ├── _buttons.css                  # Стилове за бутони
    │   ├── _cards.css                    # Стилове за карти
    │   ├── _forms.css                    # Стилове за форми
    │   ├── _modals.css                   # Стилове за модални прозорци
    │   ├── _notifications.css            # Стилове за нотификации
    │   ├── _tables.css                   # Стилове за таблици
    │   └── _tabs.css                     # Стилове за табове
    │
    ├── layout/                           # Layout стилове
    │   ├── _footer.css                   # Footer стилове
    │   ├── _grid.css                     # Grid система
    │   └── _header.css                   # Header и навигация
    │
    ├── pages/                            # Стилове за страници
    │   ├── _achievements.css             # Постижения
    │   ├── _admin.css                    # Административни страници
    │   ├── _auth.css                     # Автентикация (login/register)
    │   ├── _credits.css                  # Кредитна система
    │   ├── _dashboard.css                # Табла (всички роли)
    │   ├── _events.css                   # Събития
    │   ├── _goals.css                    # Цели
    │   ├── _interests.css                # Интереси и хобита
    │   ├── _portfolio.css                # Портфолио
    │   ├── _profile.css                  # Профил
    │   ├── _sanctions.css                # Санкции
    │   └── _teacher.css                  # Учителски страници
    │
    └── themes/                           # Теми
        ├── _dark.css                     # Тъмна тема
        └── _light.css                    # Светла тема

```

## Описание на компонентите

### Общи компоненти (`/components/common/`)

- **ErrorBoundary.jsx** - React Error Boundary за прихващане на грешки в компонентното дърво
- **Footer.jsx** - Footer с информация за училището и полезни връзки
- **Header.jsx** - Навигационен header с динамично меню според ролята на потребителя
- **Home.jsx** - Начална страница с информация за системата
- **NotificationProvider.jsx** - Context Provider за глобални нотификации
- **Notifications.jsx** - Компонент за визуализиране на нотификации (success, error, info, warning)
- **ThemeToggle.jsx** - Бутон за превключване между светла и тъмна тема

### Автентикационни компоненти (`/components/auth/`)

- **AuthGuard.jsx** - HOC за защита на рутове, изискващи автентикация
- **ConfirmRegistration.jsx** - Обработва потвърждаване на регистрация чрез email токен
- **EmailLogin.jsx** - Обработва вход чрез email линк
- **Login.jsx** - Форма за вход (с парола или email линк)
- **Logout.jsx** - Компонент за изход от системата
- **Register.jsx** - Форма за регистрация (ученици и учители)

### Ученически компоненти (`/components/student/`)

- **Achievements.jsx** - CRUD операции за постижения (състезания, олимпиади, сертификати)
- **CreditSystem.jsx** - Преглед и добавяне на кредити по три стълба
- **Events.jsx** - Преглед на събития и регистрация за участие
- **Goals.jsx** - Управление на цели в 6 категории
- **InterestsAndHobbies.jsx** - Редактиране на интереси и хобита
- **Portfolio.jsx** - Създаване и редактиране на портфолио
- **Sanctions.jsx** - Преглед на санкции, отсъствия и забележки
- **StudentDashboard.jsx** - Обобщено табло с бърз достъп до функции
- **StudentProfile.jsx** - Профилна информация на ученика

### Учителски компоненти (`/components/teacher/`)

- **TeacherCreditsManagement.jsx** - Валидиране и управление на ученически кредити
- **TeacherDashboard.jsx** - Табло със статистики и бързи действия
- **TeacherEvents.jsx** - CRUD операции за събития
- **TeacherReports.jsx** - Генериране на отчети (PDF/Excel)
- **TeacherSanctions.jsx** - Управление на санкции и отсъствия на ученик
- **TeacherStudentDetails.jsx** - Детайлен преглед на ученически профил
- **TeacherStudents.jsx** - Списък с ученици с филтриране

### Административни компоненти (`/components/admin/`)

- **AdminCreditCategories.jsx** - CRUD операции за категории в кредитната система
- **AdminDashboard.jsx** - Административно табло със системни статистики

## Описание на CSS файловете

### Базови стилове (`/styles/base/`)

- **_variables.css** - CSS променливи за цветове, размери, spacing, typography, shadows
- **_reset.css** - Нулиране на браузър стилове и глобални настройки
- **_utilities.css** - Помощни класове, responsive правила, анимации

### Компонентни стилове (`/styles/components/`)

- **_buttons.css** - Стилове за различни типове бутони (primary, secondary, delete, etc.)
- **_cards.css** - Стилове за карти с hover ефекти
- **_forms.css** - Стилове за форми, input полета и валидация
- **_modals.css** - Стилове за модални прозорци
- **_notifications.css** - Стилове за нотификационни съобщения
- **_tables.css** - Стилове за таблици и grid layouts
- **_tabs.css** - Стилове за tab навигация

### Layout стилове (`/styles/layout/`)

- **_footer.css** - Footer layout и стилове
- **_grid.css** - Основен grid container и layout система
- **_header.css** - Header навигация, dropdown менюта, responsive

### Стилове за страници (`/styles/pages/`)

- **_achievements.css** - Стилове за страница с постижения
- **_admin.css** - Административни страници и компоненти
- **_auth.css** - Login и Register форми
- **_credits.css** - Кредитна система, прогрес барове
- **_dashboard.css** - Табла за всички роли
- **_events.css** - Събития, карти за събития
- **_goals.css** - Цели и категории
- **_interests.css** - Интереси и хобита
- **_portfolio.css** - Портфолио секции
- **_profile.css** - Профилни страници
- **_sanctions.css** - Санкции и отсъствия
- **_teacher.css** - Всички учителски страници

### Теми (`/styles/themes/`)

- **_dark.css** - Тъмна тема с override на променливи
- **_light.css** - Светла тема (default)

## Основни функционалности

### За ученици:
- Управление на кредити по три стълба (Аз и другите, Мислене, Професия)
- Създаване и поддържане на портфолио
- Регистрация за събития и потвърждаване на участие
- Добавяне на постижения и сертификати
- Задаване на цели в различни категории
- Преглед на санкции и отсъствия

### За учители:
- Валидиране на ученически кредити
- Създаване и управление на събития
- Преглед на ученически профили
- Управление на санкции и отсъствия
- Генериране на отчети

### За администратори:
- Управление на категории в кредитната система
- Системни статистики
- Управление на потребители (планирано)

## Сигурност

- JWT токени за автентикация
- Protected routes чрез AuthGuard
- Role-based access control
- XSS защита чрез React
- Валидация на входни данни

## Използвани дизайн принципи

1. **Йерархия** - Създадена е ясна визуална йерархия на елементите в интерфейса.
2. **Композиция** - Използвано е правилото на третините за баланс в дизайна.
3. **Фокусни точки** - Ключовите действия и информация са ясно открояващи се.
4. **Цветове** - Използвана е ограничена цветова схема с основни и акцентни цветове.
5. **Типография** - Sans-serif шрифтове за заглавия и удобни за четене шрифтове за съдържание.
6. **Поток** - Направляване на погледа в Z-образен модел.
7. **Подравняване** - Консистентно подравняване на елементите за професионален вид.

## Responsive дизайн

Приложението е напълно responsive и се адаптира към различни екрани:
- Десктоп (>= 1024px)
- Таблет (768px - 1023px)
- Мобилен (< 768px)

## Функционалности

### Автентикация
- Регистрация на ученик с основни данни
- Вход с имейл и парола
- Защитени маршрути

### Профил на ученика
- Основна информация (име, клас, специалност)
- Среден успех
- Рейтинг по кредитна система

### Портфолио
- Професионален опит
- Ключови проекти и продукти
- Препоръки
- Ментор по специалността

### Годишни цели
- Категории с цели (лични, академични, професионални)
- Ключови дейности за постигане на целите

### Кредитна система
- Проследяване на натрупаните кредити
- Визуализация на напредъка по трите стълба
- Добавяне на нови кредити

### Интереси и хобита
- Области на интерес с подкатегории
- Добавяне на хобита и умения

### Постижения
- Награди от състезания
- Постижения на олимпиади
- Други постижения

### Забележки и санкции
- Отсъствия (извинени и неизвинени)
- Забележки в Школо
- Активни санкции

### Събития
- Календар с училищни събития
- Регистрация за събития
- Потвърждаване на участие
- Обратна връзка

# Технофолио - Сървърна част

RESTful API сървър за платформата за проследяване на развитието на учениците в училище Софтуни БУДИТЕЛ. Построен с Node.js, Express и MongoDB.

## Технологичен стек

- **Node.js** - JavaScript runtime
- **Express 4.18.2** - Web framework
- **MongoDB** - NoSQL база данни
- **Mongoose 7.8.6** - MongoDB ODM
- **JWT** - Автентикация и авторизация
- **bcryptjs 3.0.2** - Хеширане на пароли
- **Speakeasy** - Two-factor authentication
- **Nodemailer 6.10.1** - Изпращане на имейли
- **ExcelJS 4.4.0** - Генериране на Excel файлове
- **PDFMake 0.2.20** - Генериране на PDF файлове
- **ES6 Modules** - Модулна система

## Файлова структура

```
server/
├── index.js                              # Входна точка на сървъра
├── package.json                          # Зависимости и скриптове
├── .env                                  # Environment променливи (не се качва в git)
│
├── config/                               # Конфигурационни файлове
│   ├── config.js                         # Централизирана конфигурация
│   └── db.js                             # MongoDB връзка
│
├── models/                               # Mongoose модели
│   ├── Achievement.js                    # Модел за постижения
│   ├── AuditLog.js                       # Модел за audit логове
│   ├── Credit.js                         # Модел за кредити
│   ├── CreditCategory.js                 # Модел за категории кредити
│   ├── Event.js                          # Модел за събития
│   ├── EventParticipation.js             # Модел за участия в събития
│   ├── Notification.js                   # Модел за известия
│   └── User.js                           # Модел за потребители (с вградени данни)
│
├── controllers/                          # Route controllers
│   ├── achievementsController.js         # Контролер за постижения
│   ├── authController.js                 # Контролер за автентикация
│   ├── creditsController.js              # Контролер за кредити
│   ├── eventsController.js               # Контролер за събития
│   ├── notificationsController.js        # Контролер за известия
│   ├── reportsController.js              # Контролер за отчети
│   └── userController.js                 # Контролер за потребители
│
├── services/                             # Бизнес логика
│   ├── achievementsService.js            # Сервиз за постижения
│   ├── authService.js                    # Сервиз за автентикация
│   ├── creditsService.js                 # Сервиз за кредити
│   ├── eventsService.js                  # Сервиз за събития
│   ├── notificationService.js            # Сервиз за известия
│   ├── reportsService.js                 # Сервиз за отчети
│   └── userService.js                    # Сервиз за потребители
│
├── routes/                               # API routes
│   ├── achievementsRoutes.js             # Маршрути за постижения
│   ├── authRoutes.js                     # Маршрути за автентикация
│   ├── creditsRoutes.js                  # Маршрути за кредити
│   ├── eventsRoutes.js                   # Маршрути за събития
│   ├── notificationsRoutes.js            # Маршрути за известия
│   ├── reportsRoutes.js                  # Маршрути за отчети
│   └── userRoutes.js                     # Маршрути за потребители
│
├── middleware/                           # Express middleware
│   ├── audit.js                          # Audit logging middleware
│   ├── auth.js                           # JWT автентикация и авторизация
│   ├── rateLimiter.js                    # Rate limiting
│   ├── securityHeaders.js                # Helmet сигурностни headers
│   └── xss.js                            # XSS защита с DOMPurify
│
├── utils/                                # Utility функции
│   ├── AppError.js                       # Custom error клас
│   ├── catchAsync.js                     # Async error handler
│   ├── dbUtils.js                        # Database utility функции
│   ├── email.js                          # Email функционалност
│   ├── helpers.js                        # Общи помощни функции
│   ├── totp.js                           # Two-factor authentication
│   └── reports/                          # Генератори за отчети
│       ├── enhancedPdfGenerator.js       # Разширен PDF генератор
│       └── reportGenerator.js            # Базов генератор за отчети
│
├── scripts/                              # Utility скриптове
│   ├── initCreditCategories.js           # Инициализация на категории
│   └── seed.js                           # Database seeding
│
└── assets/                               # Статични ресурси
    └── fonts/                            # Шрифтове за PDF генериране
        ├── Roboto-Regular.ttf
        ├── Roboto-Medium.ttf
        ├── Roboto-Italic.ttf
        └── Roboto-MediumItalic.ttf
```

## Описание на моделите

### User.js
Най-сложният модел с вградени данни за различни роли:
- **Основни полета**: email, password, firstName, lastName, role
- **За ученици**: studentInfo, goals, interests, hobbies, portfolio, sanctions
- **За учители**: teacherInfo (subjects, qualification, yearsOfExperience)
- **Сигурност**: emailConfirmed, accountLocked, twoFactorEnabled, passwordResetToken
- **Методи**: checkPassword, changedPasswordAfter, setGoal, addRecommendation
- **Статични методи**: findStudentsByGrade, findStudentsBySpecialization, findTeachersBySubject

### Credit.js
- Връзка към User модел
- Полета: pillar, activity, description, status
- Валидация: validatedBy, validationDate, validationNote
- Индекси за оптимизация на търсенето

### Event.js
- Полета: title, description, startDate, endDate, location, organizer
- createdBy - референция към създателя
- Виртуални полета: isPast, isActive

### EventParticipation.js
- Many-to-many връзка между Event и User
- Статуси: registered, confirmed, attended, cancelled
- Feedback функционалност

### Achievement.js
- Категории: competition, olympiad, tournament, certificate, award, other
- Полета: title, description, date, place, issuer

### Notification.js
- Типове: info, success, warning, error
- Категории: event, credit, absence, sanction, system
- TTL индекс за автоматично изтриване след 30 дни

### AuditLog.js
- Логване на всички CRUD операции
- Полета: user, action, entity, entityId, details, ip, userAgent

## Описание на контролерите

### authController.js
Управлява автентикацията и авторизацията:
- `register` - Регистрация с email потвърждение
- `login` - Вход с поддръжка на 2FA
- `verifyTwoFactor` - Валидиране на 2FA код
- `forgotPassword` - Заявка за възстановяване на парола
- `resetPassword` - Нулиране на парола
- `requestLoginLink` - Вход чрез email линк
- `refreshToken` - Обновяване на JWT токен

### userController.js
Комплексен контролер за управление на потребители:
- CRUD операции за потребители
- Управление на ученически данни (goals, interests, portfolio)
- Санкции и отсъствия
- Статистики и търсене
- Масови операции

### eventsController.js
- CRUD операции за събития
- Управление на участия
- Потвърждаване и отмяна
- Отбелязване на присъствие
- Статистики

### creditsController.js
- Преглед и добавяне на кредити
- Валидиране (за учители/админи)
- Управление на категории
- Масово валидиране
- Статистики по стълбове

### achievementsController.js
- CRUD операции за постижения
- Филтриране по категория, дата, потребител
- Статистики

### notificationsController.js
- Получаване на известия
- Маркиране като прочетени
- Масово създаване
- Email интеграция

### reportsController.js
- Генериране на отчети в PDF/Excel формат
- Отчети за отсъствия
- Отчети за събития
- Индивидуални ученически отчети

## Описание на сервизите

Сервизите съдържат бизнес логиката и комуникацията с базата данни:

- **authService.js** - JWT токени, 2FA, email линкове
- **userService.js** - Комплексна логика за всички user операции
- **eventsService.js** - Събития и известия при промени
- **creditsService.js** - Валидиране и статистики
- **achievementsService.js** - Проверки за права и дублиране
- **notificationService.js** - Email изпращане и масови операции
- **reportsService.js** - Генериране на сложни отчети

## Middleware

### auth.js
- JWT верификация
- Refresh token логика
- `restrictTo()` - Role-based access control

### rateLimiter.js
- `generalLimiter` - 100 заявки/15 мин
- `authLimiter` - 10 опита за вход/час
- `passwordResetLimiter` - 3 заявки/час

### xss.js
- DOMPurify за почистване на входни данни
- Рекурсивно обработване на обекти

### audit.js
- Автоматично логване на всички операции
- IP адрес и User Agent tracking

### securityHeaders.js
- Helmet конфигурация
- CSP (Content Security Policy)
- HSTS, X-Frame-Options, etc.

## Utilities

### AppError.js
- Custom error клас с statusCode
- Operational vs Programming errors

### catchAsync.js
- Wrapper за async route handlers
- Автоматично error handling

### email.js
- Nodemailer конфигурация
- Развойна среда - Ethereal
- Продукция - реален SMTP
- HTML email templates

### totp.js
- Speakeasy интеграция
- QR код генериране
- 2FA валидиране

### helpers.js
- `compareIds` - Безопасно сравнение на MongoDB IDs
- `formatDateBG` - Форматиране на дати
- `slugify`, `groupBy`, `isValidEmail`

### reports/
- **reportGenerator.js** - Excel и PDF базова функционалност
- **enhancedPdfGenerator.js** - Сложни multi-section PDF отчети

## API Endpoints

### Автентикация (`/api/auth`)
- `POST /register` - Регистрация
- `POST /login` - Вход
- `POST /logout` - Изход
- `POST /forgot-password` - Забравена парола
- `PATCH /reset-password/:token` - Нулиране на парола
- `POST /refresh-token` - Обновяване на токен
- `GET /me` - Текущ потребител

### Потребители (`/api/users`)
- `GET /` - Всички потребители (admin)
- `POST /` - Създаване на потребител (admin)
- `GET /:id` - Данни за потребител
- `PUT /:id` - Обновяване на потребител
- `DELETE /:id` - Изтриване (admin)
- `GET /:id/goals` - Цели на ученик
- `PUT /:id/goals/:category` - Обновяване на цел
- `GET /:id/portfolio` - Портфолио
- `GET /:id/sanctions` - Санкции и отсъствия

### Събития (`/api/events`)
- `GET /` - Всички събития (публично)
- `POST /` - Създаване (teacher/admin)
- `GET /:eventId` - Детайли за събитие
- `PUT /:eventId` - Обновяване
- `DELETE /:eventId` - Изтриване
- `POST /:eventId/participate` - Регистрация

### Кредити (`/api/credits`)
- `GET /` - Кредити (филтрирани по роля)
- `POST /` - Добавяне на кредит
- `PATCH /:creditId/validate` - Валидиране (teacher/admin)
- `DELETE /:creditId` - Изтриване
- `GET /categories` - Категории
- `POST /bulk-validate` - Масово валидиране

### Постижения (`/api/achievements`)
- `GET /user/:userId` - Постижения на потребител
- `POST /` - Добавяне
- `PUT /:id` - Обновяване
- `DELETE /:id` - Изтриване
- `GET /stats` - Статистики (teacher/admin)

### Известия (`/api/notifications`)
- `GET /` - Известия на текущия потребител
- `PATCH /:notificationId/read` - Маркиране като прочетено
- `PATCH /read-all` - Маркиране на всички
- `DELETE /:notificationId` - Изтриване
- `POST /bulk` - Масово създаване (teacher/admin)

### Отчети (`/api/reports`)
- `GET /absences` - Отчет за отсъствия (teacher/admin)
- `GET /events` - Отчет за събития (teacher/admin)
- `GET /user/:userId/:format` - Индивидуален отчет

## Сигурност

### Автентикация и авторизация
- JWT токени (15 мин живот)
- Refresh токени (7 дни)
- Two-factor authentication със Speakeasy
- Role-based access control

### Защита срещу атаки
- **XSS** - DOMPurify за входни данни
- **CSRF** - SameSite cookies
- **NoSQL Injection** - express-mongo-sanitize
- **Rate Limiting** - Различни лимити за различни endpoints
- **Headers** - Helmet за сигурностни headers
- **CORS** - Конфигуриран за frontend URL

### Пароли и данни
- bcryptjs за хеширане (10 salt rounds)
- Силни парола изисквания (regex валидация)
- Account locking след 5 неуспешни опита
- Password reset tokens с 10 мин валидност

### Audit и мониторинг
- Всички CRUD операции се логват
- IP адреси и User Agents
- Timestamp за всяко действие

## Environment променливи

```env
PORT=3030
MONGODB_URI=mongodb://localhost:27017/technofolio
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=15m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email
EMAIL_PASSWORD=your-password
EMAIL_FROM_NAME=Технофолио
EMAIL_FROM_ADDRESS=noreply@technofolio.bg
```

## Скриптове

- `npm start` - Стартиране на сървъра
- `npm run dev` - Разработка с nodemon
- `npm run seed` - Попълване на базата с тестови данни
- `npm run seed:clear` - Изчистване и попълване отново

## База данни

MongoDB с Mongoose ODM. Моделите използват:
- Индекси за оптимизация
- Виртуални полета
- Pre/post middleware
- Статични и instance методи
- TTL индекси за автоматично изтриване