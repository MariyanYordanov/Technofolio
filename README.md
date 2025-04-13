# Технофолио - Структура на проекта

## Използвани технологии

- **Frontend**: React с функционални компоненти и hooks
- **Routing**: React Router v6
- **Управление на състоянието**: Context API с useReducer
- **HTTP заявки**: Fetch API
- **Стилизация**: CSS с променливи

## Файлова структура

```
/public
  /images
  /styles
    /base
      _reset.css
      _utilities.css
      _variables.css
    /components  
      _buttons.css
      _cards.css
      _forms.css
      _modals.css
      _notifications.css
      _tables.css
      _tabs.css
    /layout
      _footer.css
      _grid.css
      _headder.css
    /pages
      _achievements.css
      _auth.css
      _credits.css
      _events.css
      _goals.css
      _interests.css
      _portfolio.css
      _profile.css
      _sanctions.css
    /themes
      _dark.css
      _light.css
/src
  /components
    /common
      Notifications.jsx
      Header.jsx
      Footer.jsx
      ErrorBoundary.jsx
    /student
      StudentProfile.jsx
      Portfolio.jsx
      Goals.jsx
      CreditSystem.jsx
      InterestsAndHobbies.jsx
      Achievements.jsx
      Sanctions.jsx
      Events.jsx
    /auth
      Login.jsx
      Register.jsx
      AuthGuard.jsx
      Logout.jsx
  /contexts
    AuthContext.jsx
    CreditContext.jsx
    NotificationProvider.jsx
  /services
    authService.js
    studentService.js
    creditService.js
    eventService.js
  /hooks
    useForm.js
    useLocalStorage.js
    usePersistedState.js
  /utils
    pathUtils.js
    requestUtils.js
    notificationsUtils.js
  /lib
    request.js
  paths.js
  App.jsx
  main.jsx
.gitignore
eslint.config.js
index.html
vite.config.js
 
```

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