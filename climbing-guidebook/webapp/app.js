// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Получаем данные пользователя из Telegram
    const tg = window.Telegram?.WebApp;

    if (tg) {
        tg.expand();
        tg.ready();

        // Устанавливаем имя пользователя
        const user = tg.initDataUnsafe?.user;
        if (user) {
            document.getElementById('userName').textContent =
                user.first_name || user.username || 'Альпинист';
        }
    }

    // Инициализация компонентов
    initMenu();
    initNavigation();
    initMap();
    initRoutes();
    initModals();

    // Загрузка данных
    loadGuidebooks();
    loadRecentAscents();
});

// Инициализация меню
function initMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const closeMenuBtn = document.getElementById('closeMenu');
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.createElement('div');

    overlay.className = 'menu-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 999;
        display: none;
    `;

    document.body.appendChild(overlay);

    menuBtn.addEventListener('click', () => {
        sideMenu.style.left = '0';
        overlay.style.display = 'block';
    });

    closeMenuBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);

    function closeMenu() {
        sideMenu.style.left = '-300px';
        overlay.style.display = 'none';
    }
}

// Навигация между секциями
function initNavigation() {
    // Навигация в меню
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);
            closeMenu();
        });
    });

    // Нижняя навигация
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;

            // Обновляем активный элемент
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Показываем секцию
            showSection(section);
        });
    });

    // Кнопки в хедере
    document.getElementById('mapBtn').addEventListener('click', () => {
        showSection('map');
        updateNavigation('map');
    });

    document.getElementById('searchBtn').addEventListener('click', () => {
        showSearch();
    });
}

// Показать секцию
function showSection(sectionId) {
    // Скрываем все секции
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Показываем нужную секцию
    const targetSection = document.getElementById(sectionId + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Обновить навигацию
function updateNavigation(section) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });
}

// Инициализация карты
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Создаем карту (центр на России)
    const map = L.map('map').setView([55.7558, 37.6176], 5);

    // Добавляем слой OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Добавляем маркеры скалолазных районов
    const climbingAreas = [
        { name: "Красный Камень", coords: [44.6547, 34.8133], routes: 152 },
        { name: "Воргольские скалы", coords: [52.6717, 38.2875], routes: 89 },
        { name: "Дивногорье", coords: [50.9642, 39.3075], routes: 67 },
        { name: "Хвастовичи", coords: [53.4697, 35.0931], routes: 45 },
        { name: "Крым", coords: [44.9521, 34.1024], routes: 234 }
    ];

    climbingAreas.forEach(area => {
        const marker = L.marker(area.coords).addTo(map);
        marker.bindPopup(`
            <b>${area.name}</b><br>
            ${area.routes} маршрутов<br>
            <button onclick="openGuidebook('${area.name}')"
                    style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                Открыть гайдбук
            </button>
        `);
    });
}

// Инициализация списка маршрутов
function initRoutes() {
    const routes = [
        { id: 1, name: "Солнечный луч", grade: "6a+", area: "Красный Камень", type: "sport", height: "25m", ascents: 42 },
        { id: 2, name: "Летящая птица", grade: "6c", area: "Воргольские скалы", type: "sport", height: "18m", ascents: 28 },
        { id: 3, name: "Стена плача", grade: "7a", area: "Дивногорье", type: "trad", height: "30m", ascents: 15 },
        { id: 4, name: "Утренний луч", grade: "5c", area: "Красный Камень", type: "sport", height: "20m", ascents: 56 },
        { id: 5, name: "Путь воина", grade: "6b+", area: "Хвастовичи", type: "sport", height: "22m", ascents: 31 }
    ];

    const routesList = document.getElementById('routesList');
    if (!routesList) return;

    // Функция отрисовки маршрутов
    function renderRoutes(filteredRoutes) {
        routesList.innerHTML = '';

        filteredRoutes.forEach(route => {
            const routeElement = document.createElement('div');
            routeElement.className = 'ascent-item';
            routeElement.innerHTML = `
                <div class="ascent-info">
                    <h4>${route.name}</h4>
                    <p>${route.area} • ${route.height} • ${route.ascents} восхождений</p>
                    <span class="ascent-type">${getRouteTypeName(route.type)}</span>
                </div>
                <div class="ascent-grade">${route.grade}</div>
            `;

            routeElement.addEventListener('click', () => {
                showRouteDetails(route.id);
            });

            routesList.appendChild(routeElement);
        });
    }

    // Изначальная отрисовка
    renderRoutes(routes);

    // Фильтры
    document.getElementById('gradeFilter')?.addEventListener('change', filterRoutes);
    document.getElementById('typeFilter')?.addEventListener('change', filterRoutes);

    function filterRoutes() {
        const gradeFilter = document.getElementById('gradeFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;

        let filtered = routes;

        if (gradeFilter) {
            filtered = filtered.filter(route => {
                const gradeNum = parseInt(route.grade);
                if (gradeFilter === '4') return gradeNum < 5;
                if (gradeFilter === '5') return gradeNum === 5;
                if (gradeFilter === '6') return gradeNum === 6;
                if (gradeFilter === '7') return gradeNum >= 7;
                return true;
            });
        }

        if (typeFilter) {
            filtered = filtered.filter(route => route.type === typeFilter);
        }

        renderRoutes(filtered);
    }
}

// Получить название типа маршрута
function getRouteTypeName(type) {
    const types = {
        'sport': 'Спортивный',
        'trad': 'Традиционный',
        'boulder': 'Боулдеринг'
    };
    return types[type] || type;
}

// Инициализация модальных окон
function initModals() {
    const ascentModal = document.getElementById('ascentModal');
    const closeModalBtn = document.querySelector('.close-modal');

    // Кнопка добавления восхождения
    const addAscentBtn = document.querySelector('[data-section="ascents"]');
    if (addAscentBtn) {
        addAscentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showAscentModal();
        });
    }

    // Закрытие модального окна
    closeModalBtn?.addEventListener('click', () => {
        ascentModal.classList.remove('active');
    });

    // Закрытие по клику вне окна
    window.addEventListener('click', (e) => {
        if (e.target === ascentModal) {
            ascentModal.classList.remove('active');
        }
    });

    // Обработка формы
    document.getElementById('ascentForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        saveAscent();
    });
}

// Показать модальное окно восхождения
function showAscentModal() {
    const modal = document.getElementById('ascentModal');
    if (modal) {
        modal.classList.add('active');
        populateRouteSelect();
        document.getElementById('ascentDate').valueAsDate = new Date();
    }
}

// Заполнить список маршрутов
function populateRouteSelect() {
    const select = document.getElementById('routeSelect');
    if (!select) return;

    // В реальном приложении здесь будет запрос к API
    const routes = [
        { id: 1, name: "Солнечный луч (6a+)" },
        { id: 2, name: "Летящая птица (6c)" },
        { id: 3, name: "Стена плача (7a)" },
        { id: 4, name: "Утренний луч (5c)" }
    ];

    select.innerHTML = '<option value="">Выберите маршрут</option>';
    routes.forEach(route => {
        const option = document.createElement('option');
        option.value = route.id;
        option.textContent = route.name;
        select.appendChild(option);
    });
}

// Сохранить восхождение
function saveAscent() {
    const routeSelect = document.getElementById('routeSelect');
    const date = document.getElementById('ascentDate').value;
    const attempts = document.getElementById('attempts').value;
    const notes = document.getElementById('notes').value;

    // Отправка данных в Telegram бот
    const data = {
        type: 'ascent',
        route_id: routeSelect.value,
        route_name: routeSelect.options[routeSelect.selectedIndex]?.text,
        date: date,
        attempts: attempts,
        notes: notes,
        timestamp: new Date().toISOString()
    };

    // Отправляем данные в Telegram WebApp
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.sendData(JSON.stringify(data));
    }

    // Закрываем модальное окно
    document.getElementById('ascentModal').classList.remove('active');

    // Показываем уведомление
    alert('Восхождение успешно сохранено!');

    // Обновляем список восхождений
    loadRecentAscents();
}

// Показать детали маршрута
function showRouteDetails(routeId) {
    // В реальном приложении здесь будет переход на страницу маршрута
    alert(`Детали маршрута #${routeId}\n\nЗдесь будет подробная информация о маршруте, фото, комментарии и т.д.`);
}

// Показать поиск
function showSearch() {
    const query = prompt("Введите название маршрута или сложность:");
    if (query) {
        // В реальном приложении здесь будет поиск
        alert(`Поиск: "${query}"\n\nРезультаты будут отображены в списке маршрутов.`);
        showSection('routes');
        updateNavigation('routes');
    }
}

// Загрузка гайдбуков
function loadGuidebooks() {
    // В реальном приложении здесь будет запрос к API
    console.log("Загрузка гайдбуков...");
}

// Загрузка недавних восхождений
function loadRecentAscents() {
    // В реальном приложении здесь будет запрос к API
    console.log("Загрузка восхождений...");
}

// Открыть гайдбук
function openGuidebook(areaName) {
    alert(`Открытие гайдбука: ${areaName}`);
    // Здесь будет переход на страницу гайдбука
}

// Экспорт функций для использования в HTML
window.openGuidebook = openGuidebook;