# Supplier Websites Investigation Report

**Article tested:** 48157-33062

## AutoTrade

- **URL:** https://autotrade.su
- **Search URL:** https://autotrade.su/vladivostok
- **Requires Login:** ✓ No
- **Rendering:** ⚠️ Client-side (SPA)

### Notes:
- Initial screenshot: C:\Users\akrylova\Desktop\AI Creator\vibecoding\NewProject\AutoPartsDV\server\screenshots\autotrade-initial.png
- Found search input: [name="article"]
- Captured search form structure
- Entered search article: 48157-33062
- Could not submit form
- Search URL: https://autotrade.su/vladivostok
- Results screenshot: C:\Users\akrylova\Desktop\AI Creator\vibecoding\NewProject\AutoPartsDV\server\screenshots\autotrade-results.png
- Could not find specific results container, captured main content HTML
- ⚠️ Site appears to be client-side rendered (SPA)

### Search Form Structure:
```html
<form id="oem-search" action="/vladivostok/find" method="post">
                    <div class="input-group">
                        <input id="request" class="input-group-field" type="search" name="article" placeholder="Введите номер детали" required="">
                        <div class="input-group-button">
                            <button class="button d-flex align-items-center align-justify-center gap-2" type="submit" disabled="">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.7422 10.3439C12.5329 9.2673 13 7.9382 13 6.5C13 2.91015 10.0899 0 6.5 0C2.91015 0 0 2.91015 0 6.5C0 10.0899 2.91015 13 6.5 13C7.93858 13 9.26801 12.5327 10.3448 11.7415L10.3439 11.7422C10.3734 11.7822 10.4062 11.8204 10.4424 11.8566L14.2929 15.7071C14.6834 16.0976 15.3166 16.0976 15.7071 15.7071C16.0976 15.3166 16.0976 14.6834 15.7071 14.2929L11.8566 10.4424C11.8204 10.4062 11.7822 10.3734 11.7422 1
```

### Results Structure:
```html

        <div class="grid-container">
            <section class="padding-0 index-title-block text-center">
                <h1>Подбор и продажа автозапчастей во Владивостоке</h1>
                <span>Выберите один из трех удобных способов поиска запчастей.</span>
            </section>
            <section class="padding-0 index-search-block">
                

<div class="grid-x card-main-search search-by-auto" style="height: 168px">
    <div class="cell margin-bottom-1">
        <div class="grid-x" style="margin-left: 334px;">
            <div class="cell text-uppercase d-flex align-items-center" style="margin-bottom: 6px;gap: 12px;">
                <span class="sposob">Способ 1</span>
                <div>
                    <span class="text-pre-search">Поиск автозапчастей</span>
                    <span class="text-search">по автомобилю</span>
                </div>
            </div>
            <div class="cell d-flex align-items-center text-block">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15ZM8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="#333333"></path>
        <path d="M8.9307 6.58789L6.63969 6.875L6.55766 7.25586L7.00883 7.33789C7.3018 7.4082 7.36039 7.51367 7.29594 7.80664L6.55766 11.2754C6.3643 12.1719 6.66313 12.5938 7.36625 12.5938C7.91117 12.5938 8.54398 12.3418 8.83109 11.9961L8.91898 11.5801C8.71977 11.7559 8.4268 11.8262 8.23344 11.8262C7.95805 11.8262 7.85844 11.6328 7.92875 11.293L8.9307 6.58789Z" fill="#333333"></path>
        <path d="M9 4.5C9 5.05228 8.55229 5.5 8 5.5C7.44772 5.5 7 5.05228 7 4.5C7 3.94772 7.44772 3.5 8 3.5C8.55229 3.5 9 3.94772 9 4.5Z" fill="#333333"></path>
    </svg>
&nbsp;Для корректного поиска автозапчасти необходимо заполнить все поля.
            </div>
        </div>
    </div>
    <div class="cell">
        <form id="search-by-auto">
            <div class="input-group">
                <div class="input-mark input-group-field">
                    <input class="input-group-field mark-search-input hover" type="text" name="mark-search-input" placeholder="Марка" autocomplete="off" data-toggle="select-mark" aria-controls="select-mark" data-is-focus="false" data-yeti-box="select-mark" aria-haspopup="true" aria-expanded="true" id="7ajd68-dd-anchor" style="">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="rotate">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.64645 4.64645C1.84171 4.45118 2.15829 4.45118 2.35355 4.64645L8 10.2929L13.6464 4.64645C13.8417 4.45118 14.1583 4.45118 14.3536 4.64645C14.5488 4.84171 14.5488 5.15829 14.3536 5.35355L8.35355 11.3536C8.15829 11.5488 7.84171 11.5488 7.64645 11.3536L1.64645 5.35355C1.45118 5.15829 1.45118 4.84171 1.64645 4.64645Z" fill="#333333"></path>
    </svg>

                </div>
                <div class="dropdown-pane search-panel mark is-open has-position-bottom has-alignment-left" data-position="bottom" data-alignment="left" data-close-on-click="true" id="select-mark" data-dropdown="pqljoq-dropdown" aria-labelledby="7ajd68-dd-anchor" aria-hidden="false" data-yeti-box="select-mark" data-resize="select-mark" style="top: 818.675px; left: 407px;" data-events="resize">    <ul>
                                                    
                                                                                        <li class="title-border">
                        <span class="title">A</span>
                    </li>
                                        <li class="content-block">
                <a class="mark-item" href="javascript:void(0)" data-name="Acura" data-slug="acura">
                    Acura
                                    </a>
            </li>
                                    
                                                                                                                <li class="content-block">
                <a class="mark-item" href="javascript:void(0)" data-name="Aito" data-slug="aito">
                    Aito
                                    </a>
            </li>
                                    
                                                        <li class="content-block">
                <a class="mark-item" href="javascript:void(0)" data-name="Alfa Romeo" data-slug="alfa-romeo">
                    Alfa Romeo
                                    </a>
            </li>
                                    
                                                        <li class="content-block">
                <a class="mark-item" href="javascript:void(0)" data-name="Alpina" data-slug="alpina">
                    Alpina
                                    </a>
            </li>
                                    
```

---

## TISS

- **URL:** https://my.tiss.ru
- **Search URL:** https://my.tiss.ru/identity/login?ReturnUrl=%2Fidentity%2Fconnect%2Fauthorize%2Fcallback%3Fresponse_type%3Dcode%26client_id%3Dangular%26state%3Dfk40UmdXV05ZLnFTM3ZBQ2U1SGp2Sm0zLlkxaTF3VkhOUnJqN1NwSWlqbFdYsemicolon%25252F%26redirect_uri%3Dhttps%253A%252F%252Fmy.tiss.ru%252Fafter-login%26scope%3Dopenid%2520bff_b2bweb_api%2520offline_access%26code_challenge%3DP5UQOTlwP6Hh4WXqG7TfzlKRWDi6pfCf7RyXvbBPN9I%26code_challenge_method%3DS256%26nonce%3Dfk40UmdXV05ZLnFTM3ZBQ2U1SGp2Sm0zLlkxaTF3VkhOUnJqN1NwSWlqbFdY
- **Requires Login:** ✓ No
- **Rendering:** ✓ Server-side

### Notes:
- Initial screenshot: C:\Users\akrylova\Desktop\AI Creator\vibecoding\NewProject\AutoPartsDV\server\screenshots\tiss-initial.png
- Could not find search input automatically - attempting manual analysis
- Saved page HTML to: C:\Users\akrylova\Desktop\AI Creator\vibecoding\NewProject\AutoPartsDV\server\screenshots\tiss-page.html
- Attempting direct search URL for TISS...
- Direct search attempted, screenshot: C:\Users\akrylova\Desktop\AI Creator\vibecoding\NewProject\AutoPartsDV\server\screenshots\tiss-results-attempt.png
### Results Structure:
```html

    
<div class="app-page login-page">
    <main class="app-page__container">
        
<div class="logo">
    <a href="https://my.tiss.ru">
        <img class="logo__image" src="/identity/assets/images/logo-main.svg" alt="logo">
    </a>
</div>

        
        <div class="app-page__content py-md-3 px-lg-2">
            <div class="app-page__subtitle">Войдите, чтобы продолжить</div>
            <form class="app-page__form app-form" id="form" method="post" novalidate="">
                <div class="app-form__header app-form__header--margin-s">
                    <div class="app-form__message-container">
                        <div class="app-form__message-container-errors">
                        </div>
                    </div>
                </div>
                <div class="app-form__input-group">
                    <label for="login" class="app-form__label">E-mail</label>
                    <input type="text" id="login" class="app-form__field empty login-page__login" placeholder="E-mail" name="Login" autocomplete="username" required="" autofocus="" style="">
                </div>
                <div class="app-form__input-group app-form__input-group--with-icon">
                    <label for="password" class="app-form__label">Пароль</label>
                    <input type="password" id="password" class="app-form__field empty login-page__password" placeholder="Пароль" name="Password" required="" autocomplete="current-password" style="">
                    <button tabindex="-1" type="button" data-field="password" class="app-form__icon input-group__icon visibility-button">
                        <svg class="svg-icon"><use href="/identity/assets/images/sprite.svg#eye"></use></svg>
                    </button>
                    <div class="app-form__validation-message"></div>
                </div>
                <div class="app-form__section">
                    <a class="app-form__link login-page__forgot" href="/identity/forgot-password?ReturnUrl=%2Fidentity%2Fconnect%2Fauthorize%2Fcallback%3Fresponse_type%3Dcode%26client_id%3Dangular%26state%3Dfk40UmdXV05ZLnFTM3ZBQ2U1SGp2Sm0zLlkxaTF3VkhOUnJqN1NwSWlqbFdYsemicolon%25252F%26redirect_uri%3Dhttps%253A%252F%252Fmy.tiss.ru%252Fafter-login%26scope%3Dopenid%2520bff_b2bweb_api%2520offline_access%26code_challenge%3DP5UQOTlwP6Hh4WXqG7TfzlKRWDi6pfCf7RyXvbBPN9I%26code_challenge_method%3DS256%26nonce%3Dfk40UmdXV05ZLnFTM3ZBQ2U1SGp2Sm0zLlkxaTF3VkhOUnJqN1NwSWlqbFdY">Не помню пароль</a>
                </div>


                



            <button type="submit" id="submitButton" name="submitButton" class="app-form__button btn" disabled="">Войти</button>



            
<div class="language-switcher">
    <select id="languageSelect" onchange="changeLanguage(this.value)">
                <option value="ru" selected="">Русский</option>
                <option value="en">English</option>
    </select>
</div>


<script>
    const pathBase = "/identity";

    function changeLanguage(culture) {
        const currentCulture = getCurrentCulture();
        if (currentCulture === culture) {
            return; 
        }

        setCultureCookie(culture);

        fetch(`${pathBase}/Language/ChangeLanguage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ culture: culture })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setTimeout(() => window.location.reload(), 300);
            }
        });
    }

    function getCurrentCulture() {
        const cookies = document.cookie.split(";");
        let cultureCookie = cookies.find((cookie) =>
            cookie.trim().startsWith(".AspNetCore.Culture=")
        );

        if (cultureCookie) {
            const cookieValue = cultureCookie.trim().split("=")[1];
            const cultureMatch = cookieValue.match(/c=([^|]+)/);

            if (cultureMatch && cultureMatch[1]) {
                return cultureMatch[1].toLowerCase();
            }
        }

        const htmlLang = document.documentElement.lang;
        if (htmlLang) {
            if (htmlLang.toLowerCase().startsWith("ru")) return "ru";
            if (htmlLang.toLowerCase().startsWith("en")) return "en";
            if (htmlLang.toLowerCase().startsWith("kk")) return "kk";
            if (htmlLang.toLowerCase().startsWith("tr")) return "tr";
        }

        const languageSelect = document.getElementById("languageSelect");
        if (languageSelect && languageSelect.value) {
            return languageSelect.value;
        }

        return "ru";
    }

    function setCultureCookie(culture) {
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        document.cookie = `.AspNetCore.Culture=c=${culture}|uic=${culture}; path=/; expires=${expiryDate.toUTCString()}`;
    }

    function syncLanguageSelector() {
        cons
```

---

