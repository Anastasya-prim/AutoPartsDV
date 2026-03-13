Агрегатор автозапчастей Дальнего Востока


Поставщик	Почему не работает	Что нужно
AutoTrade	- Работает
Rossko	- Сайт показывает форму логина, без входа поиск не доступен	Указать ROSSKO_LOGIN и ROSSKO_PASSWORD в .env
MX Group - B2B-поставщик, редиректит на страницу авторизации (zakaz.mxgroup.ru)	Бизнес-договор + MXGROUP_LOGIN / MXGROUP_PASSWORD в .env
TISS - Сайт требует OAuth-авторизацию (ASP.NET Identity)	- Указать TISS_LOGIN и TISS_PASSWORD в .env
AutoBiz	- Yandex SmartCaptcha блокирует автоматику	- Запросить API-доступ: newautobiz@autobiz.ru (на сайте есть раздел API)
AM25 - Сайт не отвечает на автоматические запросы (таймаут при загрузке) - Разобраться с блокировкой или запросить API
TrustAuto	- Сам сайт пишет: «модуль поиска временно недоступен»	- Ждать, пока поставщик включит поиск, или запросить API: sales@trustautovl.ru
