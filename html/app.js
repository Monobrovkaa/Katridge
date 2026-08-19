// app.js
// Текущая компания (по умолчанию первая)
let currentCompanyId = 1;
// Функция переключения компании
function switchCompany(companyId) {
    currentCompanyId = companyId;
    // Обновить UI кнопок (подсветить активную)
    document.querySelectorAll('.company-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.companyId) === companyId);
    });
    // Перезагрузить данные на текущей странице (если есть функция loadData)
    if (typeof loadData === 'function') {
        loadData();
    }
}
// Универсальная функция запроса к API с автоматической фильтрацией по компании
function apiFetch(endpoint, options = {}) {
    // Добавляем параметр company_id, если endpoint относится к картриджам
    let url = endpoint;
    if (endpoint.includes('/cartridges')) {
        const separator = endpoint.includes('?') ? '&' : '?';
        url += ${separator}company_id=eq.${currentCompanyId};
    }
    return fetch(url, options);
}
// Инициализация – после загрузки страницы находим кнопки и вешаем обработчики
document.addEventListener('DOMContentLoaded', () => {
    // Кнопки переключения компаний
    document.querySelectorAll('.company-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchCompany(Number(btn.dataset.companyId));
        });
    });
    // Устанавливаем активную кнопку по умолчанию
    switchCompany(currentCompanyId);
});
