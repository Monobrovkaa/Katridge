// ============================================================
// 1. Состояние приложения
// ============================================================
let currentCompanyId = 1;          // ID текущей компании (по умолчанию 1)
let currentTab = 'main';            // активная вкладка: 'main', 'cartridges', 'reports'

// ============================================================
// 2. Вспомогательные функции API
// ============================================================

/**
 * Выполняет запрос к API с автоматической фильтрацией по company_id
 * для GET-запросов к эндпоинту /cartridges.
 * @param {string} endpoint - URL (например, '/cartridges' или '/cartridges?id=eq.1')
 * @param {object} options - параметры fetch (method, headers, body и т.д.)
 * @returns {Promise<Response>}
 */
function apiFetch(endpoint, options = {}) {
    // Определяем, является ли запрос GET и относится ли к картриджам
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    if (isGet && endpoint.includes('/cartridges') && !endpoint.includes('company_id')) {
        const separator = endpoint.includes('?') ? '&' : '?';
        endpoint += `${separator}company_id=eq.${currentCompanyId}`;
    }
    return fetch(endpoint, options);
}

// ============================================================
// 3. Переключение компаний
// ============================================================

function switchCompany(companyId) {
    currentCompanyId = companyId;
    // Обновить активный класс у кнопок
    document.querySelectorAll('.company-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.companyId) === companyId);
    });
    // Перезагрузить данные текущей вкладки
    loadTabContent(currentTab);
}

// ============================================================
// 4. Переключение вкладок
// ============================================================

function switchTab(tabName) {
    currentTab = tabName;
    // Скрыть все секции
    document.querySelectorAll('.tab-content').forEach(section => {
        section.style.display = 'none';
    });
    // Показать нужную
    const activeSection = document.getElementById(`tab-${tabName}`);
    if (activeSection) activeSection.style.display = 'block';

    // Обновить активный класс у кнопок вкладок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Загрузить данные для вкладки
    loadTabContent(tabName);
}

// ============================================================
// 5. Загрузка данных для вкладок
// ============================================================

function loadTabContent(tab) {
    switch (tab) {
        case 'main':
            loadMain();
            break;
        case 'cartridges':
            loadCartridges();
            break;
        case 'reports':
            loadReports();
            break;
        default:
            break;
    }
}

// ---------- Главная ----------
function loadMain() {
    const container = document.getElementById('tab-main');
    // Можно показать приветствие и общую статистику
    apiFetch('/cartridges?select=count')  // количество картриджей в текущей компании
        .then(res => res.json())
        .then(data => {
            const count = data[0]?.count || 0;
            container.innerHTML = `
                <h2>Добро пожаловать!</h2>
                <p>Вы работаете с компанией: <strong>${getCompanyName(currentCompanyId)}</strong></p>
                <p>Всего картриджей: <strong>${count}</strong></p>
            `;
        })
        .catch(err => {
            container.innerHTML = `<p>Ошибка загрузки статистики: ${err.message}</p>`;
        });
}

// ---------- Картриджи ----------
function loadCartridges() {
    const container = document.getElementById('tab-cartridges');
    container.innerHTML = '<p>Загрузка картриджей...</p>';

    apiFetch('/cartridges')
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                container.innerHTML = `
                    <p>Нет картриджей для этой компании.</p>
                    <button onclick="showAddForm()">Добавить картридж</button>
                `;
                return;
            }
            // Рендерим таблицу
            let html = `
                <button onclick="showAddForm()">Добавить картридж</button>
                <table border="1" cellpadding="5">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Модель</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            data.forEach(item => {
                html += `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.model || '—'}</td>
                        <td>${item.status || '—'}</td>
                        <td>
                            <button onclick="editCartridge(${item.id})">✏️</button>
                            <button onclick="deleteCartridge(${item.id})">🗑️</button>
                        </td>
                    </tr>
                `;
            });
            html += `</tbody></table>`;
            container.innerHTML = html;
        })
        .catch(err => {
            container.innerHTML = `<p>Ошибка загрузки: ${err.message}</p>`;
        });
}

// ---------- Отчёты ----------
function loadReports() {
    const container = document.getElementById('tab-reports');
    container.innerHTML = `
        <h2>Отчёты по компании ${getCompanyName(currentCompanyId)}</h2>
        <p>Здесь может быть ваша аналитика (например, количество по статусам).</p>
        <div id="report-chart"></div>
    `;
    // Заглушка: можно сделать запрос /cartridges и сгруппировать по статусу
    apiFetch('/cartridges')
        .then(res => res.json())
        .then(data => {
            const statusCount = {};
            data.forEach(c => {
                const s = c.status || 'unknown';
                statusCount[s] = (statusCount[s] || 0) + 1;
            });
            let reportHtml = '<ul>';
            for (const [status, count] of Object.entries(statusCount)) {
                reportHtml += `<li>${status}: ${count}</li>`;
            }
            reportHtml += '</ul>';
            document.getElementById('report-chart').innerHTML = reportHtml;
        })
        .catch(err => console.warn('Не удалось загрузить данные для отчёта'));
}

// ============================================================
// 6. Вспомогательные функции
// ============================================================

function getCompanyName(id) {
    const map = {
        1: 'Компания А',
        2: 'Компания Б'
    };
    return map[id] || `Компания ${id}`;
}

// ============================================================
// 7. CRUD операции для картриджей
// ============================================================

// ----- Добавление -----
function showAddForm() {
    const model = prompt('Введите модель картриджа:');
    if (model === null) return; // отмена
    const status = prompt('Введите статус (например, "исправен", "требуется заправка"):') || 'новый';
    // Отправляем POST с company_id
    const payload = {
        model: model,
        status: status,
        company_id: currentCompanyId
    };
    apiFetch('/cartridges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) throw new Error(`Ошибка ${res.status}`);
        return res.json();
    })
    .then(() => {
        loadTabContent('cartridges'); // перезагрузить список
    })
    .catch(err => alert(`Не удалось добавить: ${err.message}`));
}

// ----- Редактирование -----
function editCartridge(id) {
    const newModel = prompt('Введите новую модель:');
    if (newModel === null) return;
    const newStatus = prompt('Введите новый статус:');
    if (newStatus === null) return;
    const payload = { model: newModel, status: newStatus };
    apiFetch(`/cartridges?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) throw new Error(`Ошибка ${res.status}`);
        return res.json();
    })
    .then(() => {
        loadTabContent('cartridges');
    })
    .catch(err => alert(`Ошибка обновления: ${err.message}`));
}

// ----- Удаление -----
function deleteCartridge(id) {
    if (!confirm('Удалить этот картридж?')) return;
    apiFetch(`/cartridges?id=eq.${id}`, {
        method: 'DELETE'
    })
    .then(res => {
        if (!res.ok) throw new Error(`Ошибка ${res.status}`);
        return res.json();
    })
    .then(() => {
        loadTabContent('cartridges');
    })
    .catch(err => alert(`Ошибка удаления: ${err.message}`));
}

// ============================================================
// 8. Инициализация приложения
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Навесить обработчики на кнопки компаний
    document.querySelectorAll('.company-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.companyId);
            if (!isNaN(id)) switchCompany(id);
        });
    });

    // Навесить обработчики на кнопки вкладок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab) switchTab(tab);
        });
    });

    // Установить начальную компанию (активная кнопка)
    document.querySelectorAll('.company-btn').forEach(btn => {
        if (Number(btn.dataset.companyId) === currentCompanyId) {
            btn.classList.add('active');
        }
    });

    // Показать вкладку по умолчанию (main) - уже скрыта или видна?
    // По умолчанию секции скрыты через CSS, показываем только main
    switchTab('main');
});