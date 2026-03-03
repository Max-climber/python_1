// Константы для администратора
const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

// Константы для пользователей по умолчанию
const DEFAULT_USERS = [
    {
        id: "1",
        username: "user1",
        email: "user1@example.com",
        password: "password123",
        fullName: "Иван Петров",
        role: "user",
        createdAt: new Date().toISOString(),
        isActive: true
    },
    {
        id: "2",
        username: "user2",
        email: "user2@example.com",
        password: "password123",
        fullName: "Мария Сидорова",
        role: "user",
        createdAt: new Date().toISOString(),
        isActive: true
    }
];

const DEFAULT_COORDINATES = [55.7558, 37.6176];
const DEFAULT_ZOOM = 5;

function initDatabase() {
    // Инициализация районов
    if (!localStorage.getItem('climb_areas') || JSON.parse(localStorage.getItem('climb_areas')).length === 0) {
        localStorage.setItem('climb_areas', JSON.stringify([]));
    }

    // Инициализация трасс
    if (!localStorage.getItem('climb_routes') || JSON.parse(localStorage.getItem('climb_routes')).length === 0) {
        localStorage.setItem('climb_routes', JSON.stringify([]));
    }

    // Инициализация боулдерингов
    if (!localStorage.getItem('climb_boulders') || JSON.parse(localStorage.getItem('climb_boulders')).length === 0) {
        localStorage.setItem('climb_boulders', JSON.stringify([]));
    }

    // Инициализация фотографий
    if (!localStorage.getItem('climb_photos')) {
        localStorage.setItem('climb_photos', JSON.stringify([]));
    }

    // Инициализация пользователей
    if (!localStorage.getItem('climb_users')) {
        localStorage.setItem('climb_users', JSON.stringify(DEFAULT_USERS));
    }

    // Инициализация текущего пользователя
    if (!localStorage.getItem('climb_current_user')) {
        localStorage.setItem('climb_current_user', JSON.stringify(null));
    }

    // Инициализация текущего района
    if (!localStorage.getItem('climb_current_area')) {
        localStorage.setItem('climb_current_area', JSON.stringify(null));
    }

    // Инициализация текущей трассы
    if (!localStorage.getItem('climb_current_route')) {
        localStorage.setItem('climb_current_route', JSON.stringify(null));
    }

    // Инициализация настроек карты
    if (!localStorage.getItem('climb_map_settings')) {
        localStorage.setItem('climb_map_settings', JSON.stringify({
            showAreas: true,
            showRoutes: true,
            showBoulders: true
        }));
    }
}

// Функции для работы с localStorage
function getAreas() { return JSON.parse(localStorage.getItem('climb_areas')) || []; }
function getRoutes() { return JSON.parse(localStorage.getItem('climb_routes')) || []; }
function getBoulders() { return JSON.parse(localStorage.getItem('climb_boulders')) || []; }
function getPhotos() { return JSON.parse(localStorage.getItem('climb_photos')) || []; }
function getUsers() { return JSON.parse(localStorage.getItem('climb_users')) || []; }
function getCurrentUser() { return JSON.parse(localStorage.getItem('climb_current_user')); }
function getCurrentArea() { return JSON.parse(localStorage.getItem('climb_current_area')); }
function getCurrentRoute() { return JSON.parse(localStorage.getItem('climb_current_route')); }
function getMapSettings() {
    return JSON.parse(localStorage.getItem('climb_map_settings')) || {
        showAreas: true,
        showRoutes: true,
        showBoulders: true
    };
}

function saveAreas(areas) { localStorage.setItem('climb_areas', JSON.stringify(areas)); }
function saveRoutes(routes) { localStorage.setItem('climb_routes', JSON.stringify(routes)); }
function saveBoulders(boulders) { localStorage.setItem('climb_boulders', JSON.stringify(boulders)); }
function savePhotos(photos) { localStorage.setItem('climb_photos', JSON.stringify(photos)); }
function saveUsers(users) { localStorage.setItem('climb_users', JSON.stringify(users)); }
function saveCurrentUser(user) { localStorage.setItem('climb_current_user', JSON.stringify(user)); }
function saveCurrentArea(area) { localStorage.setItem('climb_current_area', JSON.stringify(area)); }
function saveCurrentRoute(route) { localStorage.setItem('climb_current_route', JSON.stringify(route)); }
function saveMapSettings(settings) { localStorage.setItem('climb_map_settings', JSON.stringify(settings)); }

class ClimbingApp {
    constructor() {
        this.currentView = 'stats';
        this.currentAreaId = null;
        this.currentClimbId = null;
        this.currentClimbType = null;
        this.searchQuery = '';
        this.deleteCallback = null;
        this.currentUser = null;
        this.isAdmin = false;
        this.viewMode = 'areas';
        this.map = null;
        this.pickerMap = null;
        this.markers = [];
        this.userLocation = null;
        this.mapSettings = getMapSettings();
        this.coordinatePickerCallback = null;
        this.pickerTarget = null;
        this.currentPhotoPreview = null;
        this.pickerMarker = null;
        this.mapLoaded = false;
        this.authMode = 'login';
        this.currentMarkup = {
            points: [],
            photoId: null,
            climbId: null,
            type: null,
            tempImageData: null,
            tempPreviewContainerId: null
        };
        this.markupMode = 'add';
        this.markupCanvas = null;
        this.markupCtx = null;
        this.currentMarkupImage = null;
        this.currentClimbTypeInDialog = 'route';
        this.init();
    }

    init() {
        initDatabase();
        this.checkAuthStatus();
        this.setupEventListeners();
        this.loadStats();
        this.loadAreas();
        this.applyMapFilterSettings();
        this.updateFabButtonVisibility();
        this.updateUserMenu();
        this.setupMarkupInDialog();
        this.initStarRatingForRouteDialog();
        this.initStarRatingForBoulderDialog();
    }

    checkAuthStatus() {
        this.currentUser = getCurrentUser();
        this.isAdmin = this.currentUser && this.currentUser.role === 'admin';
        this.updateUIForAuth();
        this.updateFabButtonVisibility();
    }

    updateUIForAuth() {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const loginMenuItem = document.getElementById('loginMenuItem');
        const registerMenuItem = document.getElementById('registerMenuItem');
        const profileMenuItem = document.getElementById('profileMenuItem');
        const logoutMenuItem = document.getElementById('logoutMenuItem');
        const adminMenuItem = document.getElementById('adminMenuItem');

        if (this.currentUser) {
            const initials = this.getInitials(this.currentUser.fullName || this.currentUser.username);
            userAvatar.innerHTML = initials || '<i class="fas fa-user"></i>';
            userName.textContent = this.currentUser.username;

            loginMenuItem.classList.add('hidden');
            registerMenuItem.classList.add('hidden');
            profileMenuItem.classList.remove('hidden');
            logoutMenuItem.classList.remove('hidden');

            if (this.isAdmin) {
                adminMenuItem.classList.remove('hidden');
            } else {
                adminMenuItem.classList.add('hidden');
            }
        } else {
            userAvatar.innerHTML = '<i class="fas fa-user"></i>';
            userName.textContent = 'Гость';

            loginMenuItem.classList.remove('hidden');
            registerMenuItem.classList.remove('hidden');
            profileMenuItem.classList.add('hidden');
            logoutMenuItem.classList.add('hidden');
            adminMenuItem.classList.add('hidden');
        }
    }

    getInitials(name) {
        if (!name) return '';
        return name.split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    updateUserMenu() {
        const userInfo = document.getElementById('userInfo');
        const userDropdown = document.getElementById('userDropdown');

        userInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target) && !userInfo.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });

        document.getElementById('loginMenuItem').addEventListener('click', () => {
            this.showAuthDialog('login');
            userDropdown.classList.remove('show');
        });

        document.getElementById('registerMenuItem').addEventListener('click', () => {
            this.showAuthDialog('register');
            userDropdown.classList.remove('show');
        });

        document.getElementById('profileMenuItem').addEventListener('click', () => {
            this.showProfileDialog();
            userDropdown.classList.remove('show');
        });

        document.getElementById('logoutMenuItem').addEventListener('click', () => {
            this.logout();
            userDropdown.classList.remove('show');
        });

        document.getElementById('adminMenuItem').addEventListener('click', () => {
            this.showAuthDialog('admin');
            userDropdown.classList.remove('show');
        });
    }

    showAuthDialog(mode = 'login') {
        this.authMode = mode;

        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });

        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        const activeTab = document.querySelector(`.auth-tab[data-form="${mode}"]`);
        const activeForm = document.getElementById(`${mode}Form`);

        if (activeTab) activeTab.classList.add('active');
        if (activeForm) activeForm.classList.add('active');

        let title = 'Вход в систему';
        let subtitle = 'Введите учетные данные';
        let submitText = 'Войти';

        switch(mode) {
            case 'login':
                title = 'Вход в систему';
                subtitle = 'Введите учетные данные';
                submitText = 'Войти';
                break;
            case 'register':
                title = 'Регистрация';
                subtitle = 'Создание нового аккаунта';
                submitText = 'Зарегистрироваться';
                break;
            case 'admin':
                title = 'Вход администратора';
                subtitle = 'Введите учетные данные администратора';
                submitText = 'Войти';
                break;
        }

        document.getElementById('authDialogTitle').textContent = title;
        document.getElementById('authDialogSubtitle').textContent = subtitle;
        document.getElementById('authSubmitBtn').textContent = submitText;

        this.showDialog('authDialog');
    }

    showProfileDialog() {
        if (!this.currentUser) return;
        this.showToast(`Вы вошли как ${this.currentUser.username} (${this.currentUser.role === 'admin' ? 'Администратор' : 'Пользователь'})`);
    }

    setupEventListeners() {
        // Навигационные табы
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });

        // Поиск
        let searchTimeout;
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.search(e.target.value);
            }, 300);
        });

        // Кнопки диалогов
        document.getElementById('authCancelBtn').addEventListener('click', () => this.hideDialog('authDialog'));
        document.getElementById('authSubmitBtn').addEventListener('click', () => this.handleAuthSubmit());

        // Вкладки в диалоге аутентификации
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const form = e.currentTarget.dataset.form;
                this.showAuthDialog(form);
            });
        });

        // FAB кнопка добавления района
        document.getElementById('addAreaFabBtn').addEventListener('click', () => {
            this.showAddAreaDialog();
        });

        // Кнопки диалогов
        document.getElementById('areaCancelBtn').addEventListener('click', () => this.hideDialog('areaDialog'));
        document.getElementById('areaSubmitBtn').addEventListener('click', () => this.handleAreaSubmit());
        document.getElementById('addClimbToAreaBtn').addEventListener('click', () => {
            this.showAddClimbDialog('route');
        });
        document.getElementById('climbCancelBtn').addEventListener('click', () => this.hideDialog('climbDialog'));
        document.getElementById('climbSubmitBtn').addEventListener('click', () => this.handleClimbSubmit());
        document.getElementById('confirmCancelBtn').addEventListener('click', () => this.hideDialog('confirmDialog'));
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            if (this.deleteCallback) {
                this.deleteCallback();
                this.hideDialog('confirmDialog');
                this.deleteCallback = null;
            }
        });

        // Кнопки навигации
        document.getElementById('backToAreasBtn').addEventListener('click', () => {
            this.showAreaList();
        });
        document.getElementById('backToAreaBtn').addEventListener('click', () => {
            if (this.viewMode === 'climbs') {
                this.showClimbsInArea(this.currentAreaId);
            } else if (this.viewMode === 'climbDetails') {
                this.showClimbsInArea(this.currentAreaId);
            }
        });

        // Кнопки карты
        document.getElementById('locateBtn').addEventListener('click', () => {
            this.locateUser();
        });
        document.getElementById('refreshMapBtn').addEventListener('click', () => {
            this.loadAllOnMap();
        });
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Кнопки выбора координат на карте
        document.getElementById('pickAreaCoordinatesBtn').addEventListener('click', () => {
            this.showCoordinatePicker('area');
        });
        document.getElementById('pickClimbCoordinatesBtn').addEventListener('click', () => {
            this.showCoordinatePicker('climb');
        });

        // Фильтры карты
        document.getElementById('showAreasFilter').addEventListener('change', (e) => {
            this.mapSettings.showAreas = e.target.checked;
            saveMapSettings(this.mapSettings);
            this.loadAllOnMap();
        });
        document.getElementById('showRoutesFilter').addEventListener('change', (e) => {
            this.mapSettings.showRoutes = e.target.checked;
            saveMapSettings(this.mapSettings);
            this.loadAllOnMap();
        });
        document.getElementById('showBouldersFilter').addEventListener('change', (e) => {
            this.mapSettings.showBoulders = e.target.checked;
            saveMapSettings(this.mapSettings);
            this.loadAllOnMap();
        });

        // Кнопки хлебных крошек
        document.getElementById('breadcrumbHome').addEventListener('click', () => {
            this.showPage('stats');
        });
        document.getElementById('breadcrumbArea').addEventListener('click', () => {
            if (this.viewMode === 'climbs' || this.viewMode === 'climbDetails') {
                this.showAreaList();
            }
        });

        // Кнопки выбора координат
        document.getElementById('pickerCancelBtn').addEventListener('click', () => this.hideDialog('coordinatePickerDialog'));
        document.getElementById('pickerSubmitBtn').addEventListener('click', () => this.handleCoordinatePickerSubmit());

        // Обработчики для загрузки фото
        this.setupPhotoUploadHandlers();

        // Обработчики для разметки
        this.setupMarkupEventListeners();

        // Клик по затемненной области диалогов
        document.querySelectorAll('.dialog-overlay').forEach(dialog => {
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    dialog.classList.add('hidden');
                }
            });
        });

        // Инициализация звездного рейтинга
        this.initStarRating();

        // Обработчики для вкладок в диалоге
        document.querySelectorAll('.climb-type-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.switchClimbType(type);
            });
        });
    }

    setupPhotoUploadHandlers() {
        // Для общего диалога
        const climbPhotoInput = document.getElementById('climbPhoto');
        const climbFileButton = climbPhotoInput.previousElementSibling;

        climbFileButton.addEventListener('click', () => {
            climbPhotoInput.click();
        });

        climbPhotoInput.addEventListener('change', (e) => {
            this.handlePhotoPreview(e, 'climbPhotoPreview');
        });
    }

    handlePhotoPreview(event, previewContainerId) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
            this.showToast('Пожалуйста, выберите файл изображения', true);
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showToast('Размер файла не должен превышать 5MB', true);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewContainer = document.getElementById(previewContainerId);
            previewContainer.innerHTML = '';

            const previewItem = document.createElement('div');
            previewItem.className = 'photo-preview-item';

            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'Preview';

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-photo-btn';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', (removeEvent) => {
                removeEvent.preventDefault();
                removeEvent.stopPropagation();
                previewContainer.innerHTML = '';
                event.target.value = '';
                this.currentPhotoPreview = null;
            });

            // Кнопка для разметки фото при добавлении маршрута
            const markupBtn = document.createElement('button');
            markupBtn.type = 'button';
            markupBtn.className = 'remove-photo-btn';
            markupBtn.innerHTML = '<i class="fas fa-draw-polygon"></i>';
            markupBtn.style.right = '25px';
            markupBtn.style.backgroundColor = 'var(--primary-color)';
            markupBtn.title = 'Разметить трассу на фото';
            markupBtn.addEventListener('click', (markupEvent) => {
                markupEvent.preventDefault();
                markupEvent.stopPropagation();
                this.showMarkupDialogForNewPhoto(e.target.result, previewContainerId);
            });

            previewItem.appendChild(img);
            previewItem.appendChild(removeBtn);
            previewItem.appendChild(markupBtn);
            previewContainer.appendChild(previewItem);

            // Сохраняем превью для последующего сохранения
            this.currentPhotoPreview = {
                data: e.target.result,
                fileName: file.name,
                type: file.type,
                markup: null
            };
        };
        reader.readAsDataURL(file);
    }

    setupMarkupInDialog() {
        // Обработчик для кнопки разметки в диалоге добавления маршрута
        document.addEventListener('click', (e) => {
            if (e.target.closest('.markup-btn') || e.target.classList.contains('fa-draw-polygon')) {
                const btn = e.target.closest('.markup-btn') || e.target.closest('button');
                if (btn) {
                    const photoId = btn.dataset.photoId;
                    const climbId = btn.dataset.climbId;
                    const type = btn.dataset.type;

                    if (photoId && climbId && type) {
                        this.showMarkupDialog(photoId, climbId, type);
                    } else {
                        // Если это кнопка в диалоге добавления маршрута
                        const previewContainer = document.getElementById('climbPhotoPreview');
                        if (previewContainer && previewContainer.querySelector('img')) {
                            const img = previewContainer.querySelector('img');
                            this.showMarkupDialogForNewPhoto(img.src, 'climbPhotoPreview');
                        }
                    }
                }
            }
        });
    }

    setupMarkupEventListeners() {
        // Кнопки разметки
        document.getElementById('addPointMode').addEventListener('click', () => {
            this.markupMode = 'add';
            this.updateMarkupMode();
        });

        document.getElementById('clearMarkup').addEventListener('click', () => {
            if (confirm('Очистить всю разметку?')) {
                this.clearMarkup();
            }
        });

        document.getElementById('cancelMarkupBtn').addEventListener('click', () => {
            this.hideDialog('markupDialog');
        });

        document.getElementById('saveMarkupBtn').addEventListener('click', () => {
            this.saveMarkup();
        });

        // Обработчик кликов для разметки
        document.getElementById('markupContainer').addEventListener('click', (e) => {
            this.handleMarkupClick(e);
        });
    }

    updateMarkupMode() {
        const addBtn = document.getElementById('addPointMode');
        if (this.markupMode === 'add') {
            addBtn.classList.add('active');
        } else {
            addBtn.classList.remove('active');
        }
    }

    initStarRatingForRouteDialog() {
        const stars = document.querySelectorAll('#routeStarRating i');
        const hiddenInput = document.getElementById('routeRating');

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                hiddenInput.value = rating;

                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas', 'active');
                    } else {
                        s.classList.remove('fas', 'active');
                        s.classList.add('far');
                    }
                });
            });

            star.addEventListener('mouseover', () => {
                const hoverRating = parseInt(star.dataset.rating);
                const currentRating = parseInt(hiddenInput.value) || 0;

                if (currentRating > 0) return;

                stars.forEach((s, index) => {
                    if (index < hoverRating) {
                        s.classList.add('hover');
                    } else {
                        s.classList.remove('hover');
                    }
                });
            });

            star.addEventListener('mouseout', () => {
                const currentRating = parseInt(hiddenInput.value) || 0;
                stars.forEach(s => s.classList.remove('hover'));

                stars.forEach((s, index) => {
                    if (index < currentRating) {
                        s.classList.add('active');
                    }
                });
            });
        });
    }

    initStarRatingForBoulderDialog() {
        const stars = document.querySelectorAll('#boulderStarRating i');
        const hiddenInput = document.getElementById('boulderRating');

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                hiddenInput.value = rating;

                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas', 'active');
                    } else {
                        s.classList.remove('fas', 'active');
                        s.classList.add('far');
                    }
                });
            });

            star.addEventListener('mouseover', () => {
                const hoverRating = parseInt(star.dataset.rating);
                const currentRating = parseInt(hiddenInput.value) || 0;

                if (currentRating > 0) return;

                stars.forEach((s, index) => {
                    if (index < hoverRating) {
                        s.classList.add('hover');
                    } else {
                        s.classList.remove('hover');
                    }
                });
            });

            star.addEventListener('mouseout', () => {
                const currentRating = parseInt(hiddenInput.value) || 0;
                stars.forEach(s => s.classList.remove('hover'));

                stars.forEach((s, index) => {
                    if (index < currentRating) {
                        s.classList.add('active');
                    }
                });
            });
        });
    }

    switchClimbType(type) {
        this.currentClimbTypeInDialog = type;

        // Обновляем активные вкладки
        document.querySelectorAll('.climb-type-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.climb-type-content').forEach(content => {
            content.classList.remove('active');
        });

        document.querySelector(`.climb-type-tab[data-type="${type}"]`).classList.add('active');
        document.getElementById(`${type}Content`).classList.add('active');

        // Обновляем скрытое поле типа
        document.getElementById('climbType').value = type;

        // Устанавливаем звездный рейтинг по умолчанию
        if (type === 'route') {
            this.setDefaultRouteStars();
        } else {
            this.setDefaultBoulderStars();
        }

        // Обновляем заголовок
        const title = type === 'route' ? 'Добавить трассу' : 'Добавить боулдеринг';
        const subtitle = type === 'route' ? 'Создание новой скалолазной трассы' : 'Создание нового боулдеринга';
        document.getElementById('climbDialogTitle').textContent = title;
        document.getElementById('climbDialogSubtitle').textContent = subtitle;

        // Обновляем текст кнопки
        const submitBtn = document.getElementById('climbSubmitBtn');
        if (document.getElementById('climbId').value) {
            submitBtn.textContent = 'Сохранить';
        } else {
            submitBtn.textContent = 'Добавить';
        }
    }

    setDefaultRouteStars() {
        const stars = document.querySelectorAll('#routeStarRating i');
        const hiddenInput = document.getElementById('routeRating');

        // Устанавливаем 3 звезды по умолчанию
        hiddenInput.value = 3;

        stars.forEach((star, index) => {
            if (index < 3) {
                star.classList.remove('far');
                star.classList.add('fas', 'active');
            } else {
                star.classList.remove('fas', 'active');
                star.classList.add('far');
            }
        });
    }

    setDefaultBoulderStars() {
        const stars = document.querySelectorAll('#boulderStarRating i');
        const hiddenInput = document.getElementById('boulderRating');

        // Устанавливаем 3 звезды по умолчанию
        hiddenInput.value = 3;

        stars.forEach((star, index) => {
            if (index < 3) {
                star.classList.remove('far');
                star.classList.add('fas', 'active');
            } else {
                star.classList.remove('fas', 'active');
                star.classList.add('far');
            }
        });
    }

    handleAuthSubmit() {
        switch(this.authMode) {
            case 'login':
                this.handleUserLogin();
                break;
            case 'register':
                this.handleUserRegister();
                break;
            case 'admin':
                this.handleAdminLogin();
                break;
        }
    }

    handleUserLogin() {
        const usernameOrEmail = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!usernameOrEmail || !password) {
            this.showToast('Заполните все поля', true);
            return;
        }

        const users = getUsers();
        const user = users.find(u =>
            (u.username === usernameOrEmail || u.email === usernameOrEmail) &&
            u.password === password &&
            u.isActive === true
        );

        if (user) {
            saveCurrentUser(user);
            this.currentUser = user;
            this.isAdmin = user.role === 'admin';

            this.updateUIForAuth();
            this.hideDialog('authDialog');
            this.showToast(`Добро пожаловать, ${user.username}!`);

            this.reloadCurrentView();
            this.updateFabButtonVisibility();
        } else {
            this.showToast('Неверное имя пользователя или пароль', true);
        }
    }

    handleUserRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
        const fullName = document.getElementById('registerFullName').value.trim();

        if (!username || !email || !password || !confirmPassword) {
            this.showToast('Заполните все обязательные поля', true);
            return;
        }

        if (password !== confirmPassword) {
            this.showToast('Пароли не совпадают', true);
            return;
        }

        if (password.length < 6) {
            this.showToast('Пароль должен быть не менее 6 символов', true);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showToast('Введите корректный email', true);
            return;
        }

        const users = getUsers();

        const usernameExists = users.some(u => u.username === username);
        const emailExists = users.some(u => u.email === email);

        if (usernameExists) {
            this.showToast('Имя пользователя уже занято', true);
            return;
        }

        if (emailExists) {
            this.showToast('Email уже зарегистрирован', true);
            return;
        }

        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password,
            fullName,
            role: 'user',
            createdAt: new Date().toISOString(),
            isActive: true
        };

        users.push(newUser);
        saveUsers(users);

        saveCurrentUser(newUser);
        this.currentUser = newUser;
        this.isAdmin = false;

        this.updateUIForAuth();
        this.hideDialog('authDialog');
        this.showToast(`Регистрация успешна! Добро пожаловать, ${username}!`);

        this.reloadCurrentView();
        this.updateFabButtonVisibility();
    }

    handleAdminLogin() {
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value.trim();

        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            let users = getUsers();
            let adminUser = users.find(u => u.username === 'admin' && u.role === 'admin');

            if (!adminUser) {
                adminUser = {
                    id: 'admin',
                    username: 'admin',
                    email: 'admin@example.com',
                    password: ADMIN_CREDENTIALS.password,
                    fullName: 'Администратор',
                    role: 'admin',
                    createdAt: new Date().toISOString(),
                    isActive: true
                };

                users.push(adminUser);
                saveUsers(users);
            }

            saveCurrentUser(adminUser);
            this.currentUser = adminUser;
            this.isAdmin = true;

            this.updateUIForAuth();
            this.hideDialog('authDialog');
            this.showToast('Вход выполнен как администратор');

            this.reloadCurrentView();
            this.updateFabButtonVisibility();
        } else {
            this.showToast('Неверные учетные данные администратора', true);
        }
    }

    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            saveCurrentUser(null);
            this.currentUser = null;
            this.isAdmin = false;
            this.updateUIForAuth();
            this.showToast('Вы вышли из системы');
            this.reloadCurrentView();
            this.updateFabButtonVisibility();
        }
    }

    updateFabButtonVisibility() {
        const fabBtn = document.getElementById('addAreaFabBtn');

        if (this.currentView === 'guidebooks' &&
            this.viewMode === 'areas' &&
            this.isAdmin) {
            fabBtn.classList.remove('hidden');
        } else {
            fabBtn.classList.add('hidden');
        }
    }

    applyMapFilterSettings() {
        document.getElementById('showAreasFilter').checked = this.mapSettings.showAreas;
        document.getElementById('showRoutesFilter').checked = this.mapSettings.showRoutes;
        document.getElementById('showBouldersFilter').checked = this.mapSettings.showBoulders;
    }

    initStarRating() {
        const stars = document.querySelectorAll('.star-rating i');
        const hiddenInput = document.getElementById('boulderRating');

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                const currentRating = parseInt(hiddenInput.value) || 0;

                if (rating === currentRating) {
                    hiddenInput.value = 0;
                    stars.forEach(s => {
                        s.classList.remove('fas', 'active');
                        s.classList.add('far');
                    });
                } else {
                    hiddenInput.value = rating;

                    stars.forEach((s, index) => {
                        if (index < rating) {
                            s.classList.remove('far');
                            s.classList.add('fas', 'active');
                        } else {
                            s.classList.remove('fas', 'active');
                            s.classList.add('far');
                        }
                    });
                }
            });

            star.addEventListener('mouseover', () => {
                const hoverRating = parseInt(star.dataset.rating);
                const currentRating = parseInt(hiddenInput.value) || 0;

                if (currentRating > 0) return;

                stars.forEach((s, index) => {
                    if (index < hoverRating) {
                        s.classList.add('hover');
                    } else {
                        s.classList.remove('hover');
                    }
                });
            });

            star.addEventListener('mouseout', () => {
                const currentRating = parseInt(hiddenInput.value) || 0;
                stars.forEach(s => s.classList.remove('hover'));

                stars.forEach((s, index) => {
                    if (index < currentRating) {
                        s.classList.add('active');
                    }
                });
            });
        });
    }

    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star" style="color: #ffc107; margin-right: 3px;"></i>';
            } else {
                stars += '<i class="far fa-star" style="color: #ccc; margin-right: 3px;"></i>';
            }
        }
        return stars;
    }

    initMap() {
        if (this.map) {
            this.loadAllOnMap();
            return;
        }

        try {
            this.map = L.map('mapContainer', {
                attributionControl: false
            }).setView(DEFAULT_COORDINATES, DEFAULT_ZOOM);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(this.map);

            this.loadAllOnMap();
            document.getElementById('mapEmptyState').classList.add('hidden');
            this.mapLoaded = true;

        } catch (error) {
            console.error('Ошибка при инициализации карты:', error);
            this.showToast('Не удалось загрузить карту', true);
            document.getElementById('mapEmptyState').classList.remove('hidden');
        }
    }

    destroyMap() {
        if (this.map) {
            this.map.remove();
            this.map = null;
            this.markers = [];
            this.mapLoaded = false;
        }
    }

    initPickerMap() {
        try {
            const pickerContainer = document.getElementById('coordinatePickerMap');
            if (!pickerContainer) return;

            this.pickerMap = L.map('coordinatePickerMap', {
                attributionControl: false
            }).setView(DEFAULT_COORDINATES, 10);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(this.pickerMap);

            this.pickerMap.on('click', (e) => {
                const coords = e.latlng;
                document.getElementById('pickerLatitude').value = coords.lat.toFixed(6);
                document.getElementById('pickerLongitude').value = coords.lng.toFixed(6);
                document.getElementById('coordinatesPreview').textContent =
                    `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;

                if (this.pickerMarker) {
                    this.pickerMap.removeLayer(this.pickerMarker);
                }

                this.pickerMarker = L.marker([coords.lat, coords.lng]).addTo(this.pickerMap);
            });

        } catch (error) {
            console.error('Ошибка при инициализации карты выбора:', error);
        }
    }

    loadAllOnMap() {
        if (!this.map) return;

        this.markers.forEach(marker => {
            if (marker && marker.remove) marker.remove();
        });
        this.markers = [];

        const areas = getAreas();
        const routes = getRoutes();
        const boulders = getBoulders();

        if (areas.length === 0 && routes.length === 0 && boulders.length === 0) {
            document.getElementById('mapEmptyState').classList.remove('hidden');
            return;
        }

        document.getElementById('mapEmptyState').classList.add('hidden');

        const allCoordinates = [];

        if (this.mapSettings.showAreas) {
            areas.forEach(area => {
                const marker = this.createAreaMarker(area);
                if (marker) {
                    allCoordinates.push([area.latitude, area.longitude]);
                }
            });
        }

        if (this.mapSettings.showRoutes) {
            routes.forEach(route => {
                const marker = this.createRouteMarker(route);
                if (marker) {
                    const lat = route.latitude || this.getAreaCoordinates(route.areaId)?.lat;
                    const lng = route.longitude || this.getAreaCoordinates(route.areaId)?.lng;
                    if (lat && lng) allCoordinates.push([lat, lng]);
                }
            });
        }

        if (this.mapSettings.showBoulders) {
            boulders.forEach(boulder => {
                const marker = this.createBoulderMarker(boulder);
                if (marker) {
                    const lat = boulder.latitude || this.getAreaCoordinates(boulder.areaId)?.lat;
                    const lng = boulder.longitude || this.getAreaCoordinates(boulder.areaId)?.lng;
                    if (lat && lng) allCoordinates.push([lat, lng]);
                }
            });
        }

        if (allCoordinates.length > 0) {
            const bounds = L.latLngBounds(allCoordinates);
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    getAreaCoordinates(areaId) {
        const area = getAreas().find(a => a.id === areaId);
        if (area && area.latitude && area.longitude) {
            return { lat: parseFloat(area.latitude), lng: parseFloat(area.longitude) };
        }
        return null;
    }

    createAreaMarker(area) {
        if (!area.latitude || !area.longitude) return null;

        const coordinates = [parseFloat(area.latitude), parseFloat(area.longitude)];

        const areaIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: var(--primary-color); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                    <i class="fas fa-mountain" style="font-size: 14px;"></i>
                  </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const marker = L.marker(coordinates, { icon: areaIcon })
            .addTo(this.map)
            .bindPopup(this.createAreaPopupContent(area));

        marker.areaId = area.id;
        this.markers.push(marker);
        return marker;
    }

    createRouteMarker(route) {
        let coordinates;
        if (route.latitude && route.longitude) {
            coordinates = [parseFloat(route.latitude), parseFloat(route.longitude)];
        } else {
            const areaCoords = this.getAreaCoordinates(route.areaId);
            if (!areaCoords) return null;
            coordinates = [areaCoords.lat, areaCoords.lng];
        }

        const routeIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: var(--route-color); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                    <i class="fas fa-mountain" style="font-size: 12px;"></i>
                  </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        const marker = L.marker(coordinates, { icon: routeIcon })
            .addTo(this.map)
            .bindPopup(this.createRoutePopupContent(route));

        marker.routeId = route.id;
        this.markers.push(marker);
        return marker;
    }

    createBoulderMarker(boulder) {
        let coordinates;
        if (boulder.latitude && boulder.longitude) {
            coordinates = [parseFloat(boulder.latitude), parseFloat(boulder.longitude)];
        } else {
            const areaCoords = this.getAreaCoordinates(boulder.areaId);
            if (!areaCoords) return null;
            coordinates = [areaCoords.lat, areaCoords.lng];
        }

        const boulderIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: var(--boulder-color); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                    <i class="fas fa-hiking" style="font-size: 12px;"></i>
                  </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        const marker = L.marker(coordinates, { icon: boulderIcon })
            .addTo(this.map)
            .bindPopup(this.createBoulderPopupContent(boulder));

        marker.boulderId = boulder.id;
        this.markers.push(marker);
        return marker;
    }

    createAreaPopupContent(area) {
        const routeCount = getRoutes().filter(r => r.areaId === area.id).length;
        const boulderCount = getBoulders().filter(b => b.areaId === area.id).length;

        return `
            <div class="balloon-content">
                <div class="balloon-title">${area.name}</div>
                <div class="balloon-subtitle">${area.location}</div>
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #a0a0b0;">
                    ${area.description ? (area.description.length > 100 ? area.description.substring(0, 100) + '...' : area.description) : 'Нет описания'}
                </p>
                <div class="balloon-stats">
                    <div class="balloon-stat">
                        <div class="balloon-stat-number">${routeCount}</div>
                        <div class="balloon-stat-label">Трасс</div>
                    </div>
                    <div class="balloon-stat">
                        <div class="balloon-stat-number">${boulderCount}</div>
                        <div class="balloon-stat-label">Боулдерингов</div>
                    </div>
                    <div class="balloon-stat">
                        <div class="balloon-stat-number">${routeCount + boulderCount}</div>
                        <div class="balloon-stat-label">Всего</div>
                    </div>
                </div>
                <div class="balloon-actions">
                    <button class="balloon-btn primary" onclick="app.showClimbsInArea('${area.id}')">
                        Показать маршруты
                    </button>
                    ${this.isAdmin ? `
                    <button class="balloon-btn success" onclick="app.showEditAreaDialog('${area.id}')">
                        Редактировать
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createRoutePopupContent(route) {
        const hasPhotos = getPhotos().filter(p => p.climbId === route.id && p.type === 'route').length > 0;

        return `
            <div class="balloon-content">
                <div class="balloon-title">${route.name}</div>
                <div class="balloon-subtitle">Трасса • ${route.grade.toUpperCase()}</div>
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #a0a0b0;">
                    ${route.description ? (route.description.length > 100 ? route.description.substring(0, 100) + '...' : route.description) : 'Нет описания'}
                </p>
                <div class="balloon-stats">
                    <div class="balloon-stat">
                        <div class="balloon-stat-number">${route.length}</div>
                        <div class="balloon-stat-label">Длина (м)</div>
                    </div>
                    <div class="balloon-stat">
                        <div class="balloon-stat-number">${route.bolts || 0}</div>
                        <div class="balloon-stat-label">Оттяжек</div>
                    </div>
                    <div class="balloon-stat">
                        <div class="balloon-stat-number">${route.sector}</div>
                        <div class="balloon-stat-label">Сектор</div>
                    </div>
                </div>
                <div class="balloon-actions">
                    <button class="balloon-btn primary" onclick="app.showClimbDetails('${route.id}', 'route')">
                        Подробнее
                    </button>
                    ${this.isAdmin ? `
                    <button class="balloon-btn success" onclick="app.showEditClimbDialog('${route.id}', 'route')">
                        Редактировать
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createBoulderPopupContent(boulder) {
        const hasPhotos = getPhotos().filter(p => p.climbId === boulder.id && p.type === 'boulder').length > 0;

        return `
            <div class="balloon-content">
                <div class="balloon-title">${boulder.name}</div>
                <div class="balloon-subtitle">Боулдеринг • ${boulder.grade}</div>
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #a0a0b0;">
                    ${boulder.description ? (boulder.description.length > 100 ? boulder.description.substring(0, 100) + '...' : boulder.description) : 'Нет описания'}
                </p>
                <div class="balloon-stats">
                    <div class="balloon-stat">
                        <div class="balloon-stat-number">${boulder.height}</div>
                        <div class="balloon-stat-label">Высота (м)</div>
                    </div>
                    <div class="balloon-stat">
                        <div class="balloon-stat-number">${boulder.rating || 0}/5</div>
                        <div class="balloon-stat-label">Рейтинг</div>
                    </div>
                </div>
                <div class="balloon-actions">
                    <button class="balloon-btn primary" onclick="app.showClimbDetails('${boulder.id}', 'boulder')">
                        Подробнее
                    </button>
                    ${this.isAdmin ? `
                    <button class="balloon-btn success" onclick="app.showEditClimbDialog('${boulder.id}', 'boulder')">
                        Редактировать
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    toggleFullscreen() {
        const mapContainer = document.getElementById('mapContainer');
        if (!document.fullscreenElement) {
            if (mapContainer.requestFullscreen) {
                mapContainer.requestFullscreen();
            } else if (mapContainer.webkitRequestFullscreen) {
                mapContainer.webkitRequestFullscreen();
            } else if (mapContainer.msRequestFullscreen) {
                mapContainer.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    showCoordinatePicker(targetField) {
        this.pickerTarget = targetField;
        this.showDialog('coordinatePickerDialog');

        if (!this.pickerMap) {
            setTimeout(() => {
                this.initPickerMap();
            }, 100);
        } else {
            const currentCoords = this.getCurrentCoordinatesForTarget(targetField);
            if (currentCoords) {
                this.pickerMap.setView([currentCoords.lat, currentCoords.lng], 15);

                if (this.pickerMarker) {
                    this.pickerMap.removeLayer(this.pickerMarker);
                }

                this.pickerMarker = L.marker([currentCoords.lat, currentCoords.lng]).addTo(this.pickerMap);
                document.getElementById('pickerLatitude').value = currentCoords.lat;
                document.getElementById('pickerLongitude').value = currentCoords.lng;
                document.getElementById('coordinatesPreview').textContent =
                    `${currentCoords.lat}, ${currentCoords.lng}`;
            } else {
                this.pickerMap.setView(DEFAULT_COORDINATES, 10);
            }
        }
    }

    getCurrentCoordinatesForTarget(targetField) {
        if (targetField === 'area') {
            const lat = document.getElementById('areaLatitude').value;
            const lng = document.getElementById('areaLongitude').value;
            if (lat && lng) {
                return { lat: parseFloat(lat), lng: parseFloat(lng) };
            }
        } else if (targetField === 'climb') {
            const lat = document.getElementById('climbLatitude').value;
            const lng = document.getElementById('climbLongitude').value;
            if (lat && lng) {
                return { lat: parseFloat(lat), lng: parseFloat(lng) };
            }
        }
        return null;
    }

    handleCoordinatePickerSubmit() {
        const lat = document.getElementById('pickerLatitude').value;
        const lng = document.getElementById('pickerLongitude').value;

        if (!lat || !lng) {
            this.showToast('Выберите координаты на карте', true);
            return;
        }

        if (this.pickerTarget === 'area') {
            document.getElementById('areaLatitude').value = lat;
            document.getElementById('areaLongitude').value = lng;
        } else if (this.pickerTarget === 'climb') {
            document.getElementById('climbLatitude').value = lat;
            document.getElementById('climbLongitude').value = lng;
        }

        this.hideDialog('coordinatePickerDialog');
    }

    locateUser() {
        if (!navigator.geolocation) {
            this.showToast('Геолокация не поддерживается вашим браузером', true);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                if (this.map) {
                    this.map.setView([userLat, userLng], 13);
                    this.userLocation = L.marker([userLat, userLng])
                        .addTo(this.map)
                        .bindPopup('Ваше местоположение')
                        .openPopup();
                    this.showToast('Местоположение определено');
                }
            },
            (error) => {
                this.showToast('Не удалось определить местоположение', true);
            }
        );
    }

    showDialog(dialogId) {
        document.getElementById(dialogId).classList.remove('hidden');
    }

    hideDialog(dialogId) {
        document.getElementById(dialogId).classList.add('hidden');
        if (dialogId === 'climbDialog') {
            this.resetClimbDialog();
        } else if (dialogId === 'areaDialog') {
            this.resetAreaDialog();
        } else if (dialogId === 'authDialog') {
            this.resetAuthDialog();
        }
    }

    resetClimbDialog() {
        document.getElementById('climbId').value = '';
        document.getElementById('climbType').value = 'route';
        document.getElementById('climbName').value = '';
        document.getElementById('climbDescription').value = '';
        document.getElementById('routeGrade').value = '6a';
        document.getElementById('routeLength').value = '';
        document.getElementById('routeSector').value = '';
        document.getElementById('routeBolts').value = '';
        document.getElementById('boulderGrade').value = '6A';
        document.getElementById('boulderHeight').value = '';
        document.getElementById('climbLatitude').value = '';
        document.getElementById('climbLongitude').value = '';
        document.getElementById('climbPhoto').value = '';
        document.getElementById('climbPhotoPreview').innerHTML = '';
        this.currentPhotoPreview = null;

        // Сбросить звездный рейтинг для трасс
        const routeStars = document.querySelectorAll('#routeStarRating i');
        routeStars.forEach((star, index) => {
            if (index < 3) {
                star.classList.remove('far');
                star.classList.add('fas', 'active');
            } else {
                star.classList.remove('fas', 'active');
                star.classList.add('far');
            }
        });
        document.getElementById('routeRating').value = '3';

        // Сбросить звездный рейтинг для боулдерингов
        const boulderStars = document.querySelectorAll('#boulderStarRating i');
        boulderStars.forEach((star, index) => {
            if (index < 3) {
                star.classList.remove('far');
                star.classList.add('fas', 'active');
            } else {
                star.classList.remove('fas', 'active');
                star.classList.add('far');
            }
        });
        document.getElementById('boulderRating').value = '3';

        // Сбросить вкладки
        this.switchClimbType('route');
    }

    resetAreaDialog() {
        document.getElementById('areaId').value = '';
        document.getElementById('areaName').value = '';
        document.getElementById('areaLocation').value = '';
        document.getElementById('areaDescription').value = '';
        document.getElementById('areaSectors').value = '1';
        document.getElementById('areaLatitude').value = '';
        document.getElementById('areaLongitude').value = '';
    }

    resetAuthDialog() {
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerConfirmPassword').value = '';
        document.getElementById('registerFullName').value = '';
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
    }

    showPage(page) {
        // Обновить навигацию
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.nav-tab[data-page="${page}"]`).classList.add('active');

        // Скрыть все страницы
        document.querySelectorAll('.page').forEach(pageEl => {
            pageEl.classList.remove('active');
        });

        // Показать выбранную страницу
        document.getElementById(`${page}Page`).classList.add('active');

        // Обновить текущий вид
        this.currentView = page;

        if (page === 'guidebooks') {
            this.showAreaList();
        } else if (page === 'stats') {
            this.loadStats();
        }

        // Обновить заголовок
        const subtitle = page === 'stats' ? 'Статистика системы' : 'Районы и маршруты';
        document.getElementById('subtitle').textContent = subtitle;

        // Обновить видимость FAB кнопки
        this.updateFabButtonVisibility();
    }

    showAreaList() {
        this.viewMode = 'areas';
        document.getElementById('areasList').classList.remove('hidden');
        document.getElementById('areaInfoCard').classList.add('hidden');
        document.getElementById('climbsList').classList.add('hidden');
        document.getElementById('climbDetails').classList.add('hidden');
        document.getElementById('breadcrumbs').classList.add('hidden');

        this.loadAreas();
        this.initMap();
    }

    showClimbsInArea(areaId) {
        const area = getAreas().find(a => a.id === areaId);
        if (!area) return;

        this.currentAreaId = areaId;
        this.viewMode = 'climbs';
        saveCurrentArea(area);

        // Показать карточку района
        document.getElementById('areaInfoTitle').textContent = area.name;
        document.getElementById('areaInfoSubtitle').textContent = area.location;

        const routesCount = getRoutes().filter(r => r.areaId === areaId).length;
        const bouldersCount = getBoulders().filter(b => b.areaId === areaId).length;
        const totalCount = routesCount + bouldersCount;

        document.getElementById('areaRoutesCount').textContent = routesCount;
        document.getElementById('areaBouldersCount').textContent = bouldersCount;
        document.getElementById('areaTotalCount').textContent = totalCount;

        document.getElementById('areasList').classList.add('hidden');
        document.getElementById('areaInfoCard').classList.remove('hidden');
        document.getElementById('climbsList').classList.remove('hidden');

        // Загрузить маршруты
        this.loadClimbs(areaId);
    }

    loadClimbs(areaId) {
        const climbsListContent = document.getElementById('climbsListContent');
        const routes = getRoutes().filter(r => r.areaId === areaId);
        const boulders = getBoulders().filter(b => b.areaId === areaId);
        const allClimbs = [
            ...routes.map(r => ({...r, type: 'route'})),
            ...boulders.map(b => ({...b, type: 'boulder'}))
        ].sort((a, b) => a.name.localeCompare(b.name));

        if (allClimbs.length === 0) {
            climbsListContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-mountain"></i>
                    </div>
                    <div class="empty-state-title">Нет маршрутов</div>
                    <div class="empty-state-text">Добавьте первый маршрут или боулдеринг в этот район</div>
                </div>
            `;
            return;
        }

        climbsListContent.innerHTML = allClimbs.map(climb => {
            const isRoute = climb.type === 'route';
            const gradeClass = `grade-${climb.grade.charAt(0)}`;

            return `
                <div class="list-item" data-climb-id="${climb.id}" data-climb-type="${climb.type}">
                    <div class="list-icon ${climb.type}">
                        <i class="${isRoute ? 'fas fa-mountain' : 'fas fa-hiking'}"></i>
                    </div>
                    <div class="list-content">
                        <div class="list-title">${climb.name}</div>
                        <div class="list-subtitle">
                            <span class="grade-badge ${gradeClass}">${climb.grade.toUpperCase()}</span>
                            <span>•</span>
                            <span>${isRoute ? `Длина: ${climb.length}м` : `Высота: ${climb.height}м`}</span>
                            ${isRoute && climb.bolts ? `<span>•</span><span>Оттяжки: ${climb.bolts}</span>` : ''}
                        </div>
                    </div>
                    ${this.isAdmin ? `
                    <div class="action-buttons">
                        <button class="action-btn edit-btn small" onclick="event.stopPropagation(); app.showEditClimbDialog('${climb.id}', '${climb.type}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn small" onclick="event.stopPropagation(); app.showDeleteConfirmation('${climb.id}', '${climb.type}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    ` : ''}
                    <div class="list-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
        }).join('');

        // Добавляем обработчики кликов на маршруты
        document.querySelectorAll('.list-item[data-climb-id]').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.action-btn')) {
                    const climbId = e.currentTarget.dataset.climbId;
                    const climbType = e.currentTarget.dataset.climbType;
                    this.showClimbDetails(climbId, climbType);
                }
            });
        });
    }

    showClimbDetails(climbId, type) {
        const climb = type === 'route'
            ? getRoutes().find(r => r.id === climbId)
            : getBoulders().find(b => b.id === climbId);

        if (!climb) return;

        this.currentClimbId = climbId;
        this.currentClimbType = type;
        this.viewMode = 'climbDetails';
        saveCurrentRoute(climb);

        const area = getAreas().find(a => a.id === climb.areaId);
        const areaName = area ? area.name : 'Неизвестный район';

        const photos = getPhotos().filter(p => p.climbId === climbId && p.type === type);

        const detailsContainer = document.getElementById('climbDetails');
        detailsContainer.innerHTML = '';

        let detailsHtml = `
            <div class="climb-back-btn">
                <button class="btn btn-secondary" onclick="app.showClimbsInArea('${climb.areaId}')">
                    <i class="fas fa-arrow-left"></i> Назад к маршрутам района
                </button>
            </div>
            <div class="climb-details-section">
                <div class="climb-info-card">
                    <h3 style="margin-bottom: 15px;">${climb.name}</h3>
                    <div class="route-info">
                        <div class="info-row">
                            <div class="info-label">Тип:</div>
                            <div class="info-value">${type === 'route' ? 'Трасса (трудность)' : 'Боулдеринг'}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Район:</div>
                            <div class="info-value">${areaName}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Сложность:</div>
                            <div class="info-value">
                                <span class="grade-badge grade-${climb.grade.charAt(0)}">${climb.grade.toUpperCase()}</span>
                            </div>
                        </div>
        `;

        if (type === 'route') {
            detailsHtml += `
                        <div class="info-row">
                            <div class="info-label">Длина:</div>
                            <div class="info-value">${climb.length} м</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Сектор:</div>
                            <div class="info-value">${climb.sector}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Оттяжки:</div>
                            <div class="info-value">${climb.bolts || 0}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Рейтинг:</div>
                            <div class="info-value">${this.renderStars(climb.rating || 0)}</div>
                        </div>
            `;
        } else {
            detailsHtml += `
                        <div class="info-row">
                            <div class="info-label">Высота:</div>
                            <div class="info-value">${climb.height} м</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Рейтинг:</div>
                            <div class="info-value">${this.renderStars(climb.rating || 0)}</div>
                        </div>
            `;
        }

        detailsHtml += `
                        <div class="info-row">
                            <div class="info-label">Описание:</div>
                            <div class="info-value">${climb.description || 'Нет описания'}</div>
                        </div>
                    </div>
                </div>
                <div class="climb-photos-card">
                    <h4 style="margin-bottom: 15px;">Фотографии</h4>
                    ${photos.length > 0 ? `
                        <div class="photos-grid">
                            ${photos.map(photo => `
                                <div class="photo-item" onclick="app.showPhotoModal('${photo.id}')">
                                    <img src="${photo.data}" alt="Фото маршрута">
                                    ${photo.markup ? '<div style="position: absolute; bottom: 5px; right: 5px; background: var(--primary-color); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;"><i class="fas fa-draw-polygon"></i></div>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p style="color: #a0a0b0; text-align: center;">Нет фотографий</p>'}
                </div>
            </div>
        `;

        detailsContainer.innerHTML = detailsHtml;
        detailsContainer.classList.remove('hidden');

        document.getElementById('areasList').classList.add('hidden');
        document.getElementById('areaInfoCard').classList.add('hidden');
        document.getElementById('climbsList').classList.add('hidden');
    }

    showPhotoModal(photoId) {
        const photos = getPhotos();
        const photo = photos.find(p => p.id === photoId);
        if (!photo) return;

        // Создаем модальное окно для фото
        const modal = document.createElement('div');
        modal.className = 'dialog-overlay';
        modal.style.zIndex = '2000';

        let modalContent = `
            <div class="dialog-content" style="max-width: 90%; max-height: 90%; background: transparent; border: none; box-shadow: none;">
                <div style="position: relative;">
                    <button class="icon-btn" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); color: white; border: none; z-index: 10;" onclick="this.closest('.dialog-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
        `;

        // Если есть разметка, показываем с ней
        if (photo.markup && photo.markup.points && photo.markup.points.length > 0) {
            modalContent += `
                <div id="photoViewerContainer" style="position: relative; width: 100%; height: 80vh;">
                    <img src="${photo.data}" style="max-width: 100%; max-height: 100%; border-radius: 8px;">
                    <div id="photoMarkupOverlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></div>
                    <canvas id="photoMarkupCanvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>
                </div>
            `;
        } else {
            modalContent += `
                <img src="${photo.data}" style="max-width: 100%; max-height: 80vh; border-radius: 8px;">
            `;
        }

        modalContent += `
                </div>
            </div>
        `;

        modal.innerHTML = modalContent;
        document.body.appendChild(modal);

        // Если есть разметка, рисуем ее
        if (photo.markup && photo.markup.points && photo.markup.points.length > 0) {
            setTimeout(() => {
                const container = document.getElementById('photoViewerContainer');
                const canvas = document.getElementById('photoMarkupCanvas');
                const overlay = document.getElementById('photoMarkupOverlay');

                if (container && canvas) {
                    const img = container.querySelector('img');
                    if (img) {
                        img.onload = () => {
                            // Устанавливаем размер canvas равным размеру изображения
                            canvas.width = img.offsetWidth;
                            canvas.height = img.offsetHeight;

                            const ctx = canvas.getContext('2d');

                            // Рисуем линии между точками
                            if (photo.markup.points.length > 1) {
                                ctx.beginPath();
                                ctx.moveTo(
                                    photo.markup.points[0].x * canvas.width / 100,
                                    photo.markup.points[0].y * canvas.height / 100
                                );

                                for (let i = 1; i < photo.markup.points.length; i++) {
                                    ctx.lineTo(
                                        photo.markup.points[i].x * canvas.width / 100,
                                        photo.markup.points[i].y * canvas.height / 100
                                    );
                                }

                                ctx.strokeStyle = 'red';
                                ctx.lineWidth = 3;
                                ctx.stroke();
                            }

                            // Отрисовываем точки
                            photo.markup.points.forEach((point, index) => {
                                const pointElement = document.createElement('div');
                                pointElement.style.position = 'absolute';
                                pointElement.style.width = '12px';
                                pointElement.style.height = '12px';
                                pointElement.style.backgroundColor = 'red';
                                pointElement.style.borderRadius = '50%';
                                pointElement.style.border = '2px solid white';
                                pointElement.style.transform = 'translate(-50%, -50%)';
                                pointElement.style.left = `${point.x}%`;
                                pointElement.style.top = `${point.y}%`;
                                pointElement.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';

                                overlay.appendChild(pointElement);
                            });
                        };
                    }
                }
            }, 100);
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    showAddAreaDialog() {
        document.getElementById('areaDialogTitle').textContent = 'Добавить район';
        document.getElementById('areaDialogSubtitle').textContent = 'Создание нового скалолазного района';
        document.getElementById('areaSubmitBtn').textContent = 'Добавить';
        this.resetAreaDialog();
        this.showDialog('areaDialog');
    }

    showEditAreaDialog(areaId) {
        const area = getAreas().find(a => a.id === areaId);
        if (!area) return;

        document.getElementById('areaDialogTitle').textContent = 'Редактировать район';
        document.getElementById('areaDialogSubtitle').textContent = 'Изменение данных района';
        document.getElementById('areaSubmitBtn').textContent = 'Сохранить';

        document.getElementById('areaId').value = area.id;
        document.getElementById('areaName').value = area.name;
        document.getElementById('areaLocation').value = area.location;
        document.getElementById('areaDescription').value = area.description || '';
        document.getElementById('areaSectors').value = area.sectors || 1;
        document.getElementById('areaLatitude').value = area.latitude || '';
        document.getElementById('areaLongitude').value = area.longitude || '';

        this.showDialog('areaDialog');
    }

    handleAreaSubmit() {
        const areaId = document.getElementById('areaId').value;
        const name = document.getElementById('areaName').value.trim();
        const location = document.getElementById('areaLocation').value.trim();
        const description = document.getElementById('areaDescription').value.trim();
        const sectors = parseInt(document.getElementById('areaSectors').value) || 1;
        const latitude = document.getElementById('areaLatitude').value;
        const longitude = document.getElementById('areaLongitude').value;

        if (!name || !location) {
            this.showToast('Заполните обязательные поля', true);
            return;
        }

        let areas = getAreas();

        if (areaId) {
            // Редактирование существующего района
            const index = areas.findIndex(a => a.id === areaId);
            if (index !== -1) {
                areas[index] = {
                    ...areas[index],
                    name,
                    location,
                    description,
                    sectors,
                    latitude: latitude || null,
                    longitude: longitude || null
                };
                this.showToast('Район обновлен');
            }
        } else {
            // Добавление нового района
            const newArea = {
                id: Date.now().toString(),
                name,
                location,
                description,
                sectors,
                latitude: latitude || null,
                longitude: longitude || null,
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser ? this.currentUser.id : null
            };
            areas.push(newArea);
            this.showToast('Район добавлен');
        }

        saveAreas(areas);
        this.hideDialog('areaDialog');
        this.loadAreas();
        this.loadAllOnMap();
    }

    showAddClimbDialog(type = 'route') {
        this.switchClimbType(type);
        document.getElementById('climbDialogTitle').textContent = type === 'route' ? 'Добавить трассу' : 'Добавить боулдеринг';
        document.getElementById('climbDialogSubtitle').textContent = type === 'route' ? 'Создание новой скалолазной трассы' : 'Создание нового боулдеринга';
        document.getElementById('climbSubmitBtn').textContent = 'Добавить';
        this.resetClimbDialog();
        this.showDialog('climbDialog');
    }

    showEditClimbDialog(climbId, type) {
        const climb = type === 'route'
            ? getRoutes().find(r => r.id === climbId)
            : getBoulders().find(b => b.id === climbId);

        if (!climb) return;

        this.switchClimbType(type);
        document.getElementById('climbDialogTitle').textContent = 'Редактировать маршрут';
        document.getElementById('climbDialogSubtitle').textContent = 'Изменение данных маршрута';
        document.getElementById('climbSubmitBtn').textContent = 'Сохранить';

        document.getElementById('climbId').value = climb.id;
        document.getElementById('climbName').value = climb.name;
        document.getElementById('climbDescription').value = climb.description || '';
        document.getElementById('climbLatitude').value = climb.latitude || '';
        document.getElementById('climbLongitude').value = climb.longitude || '';

        if (type === 'route') {
            document.getElementById('routeGrade').value = climb.grade;
            document.getElementById('routeLength').value = climb.length;
            document.getElementById('routeSector').value = climb.sector;
            document.getElementById('routeBolts').value = climb.bolts || '';

            // Устанавливаем рейтинг для трасс
            const routeRating = climb.rating || 3;
            document.getElementById('routeRating').value = routeRating;

            // Обновить звезды для трасс
            const stars = document.querySelectorAll('#routeStarRating i');
            stars.forEach((star, index) => {
                if (index < routeRating) {
                    star.classList.remove('far');
                    star.classList.add('fas', 'active');
                } else {
                    star.classList.remove('fas', 'active');
                    star.classList.add('far');
                }
            });
        } else {
            document.getElementById('boulderGrade').value = climb.grade;
            document.getElementById('boulderHeight').value = climb.height;
            const boulderRating = climb.rating || 3;
            document.getElementById('boulderRating').value = boulderRating;

            // Обновить звезды для боулдерингов
            const stars = document.querySelectorAll('#boulderStarRating i');
            stars.forEach((star, index) => {
                if (index < boulderRating) {
                    star.classList.remove('far');
                    star.classList.add('fas', 'active');
                } else {
                    star.classList.remove('fas', 'active');
                    star.classList.add('far');
                }
            });
        }

        // Загружаем фото, если оно есть
        const photos = getPhotos();
        const existingPhoto = photos.find(p => p.climbId === climbId && p.type === type);
        if (existingPhoto) {
            const previewContainer = document.getElementById('climbPhotoPreview');
            previewContainer.innerHTML = '';

            const previewItem = document.createElement('div');
            previewItem.className = 'photo-preview-item';

            const img = document.createElement('img');
            img.src = existingPhoto.data;
            img.alt = 'Preview';

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-photo-btn';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', (removeEvent) => {
                removeEvent.preventDefault();
                removeEvent.stopPropagation();
                previewContainer.innerHTML = '';
                document.getElementById('climbPhoto').value = '';
                this.currentPhotoPreview = null;
            });

            // Кнопка для разметки фото
            const markupBtn = document.createElement('button');
            markupBtn.type = 'button';
            markupBtn.className = 'remove-photo-btn';
            markupBtn.innerHTML = '<i class="fas fa-draw-polygon"></i>';
            markupBtn.style.right = '25px';
            markupBtn.style.backgroundColor = 'var(--primary-color)';
            markupBtn.title = 'Разметить трассу на фото';
            markupBtn.addEventListener('click', (markupEvent) => {
                markupEvent.preventDefault();
                markupEvent.stopPropagation();
                this.showMarkupDialog(existingPhoto.id, climbId, type);
            });

            previewItem.appendChild(img);
            previewItem.appendChild(removeBtn);
            previewItem.appendChild(markupBtn);
            previewContainer.appendChild(previewItem);

            this.currentPhotoPreview = {
                id: existingPhoto.id,
                data: existingPhoto.data,
                fileName: existingPhoto.fileName,
                type: existingPhoto.contentType,
                markup: existingPhoto.markup || null
            };
        } else {
            document.getElementById('climbPhotoPreview').innerHTML = '';
            this.currentPhotoPreview = null;
        }

        this.showDialog('climbDialog');
    }

    handleClimbSubmit() {
        const climbId = document.getElementById('climbId').value;
        const type = document.getElementById('climbType').value;
        const name = document.getElementById('climbName').value.trim();
        const description = document.getElementById('climbDescription').value.trim();
        const latitude = document.getElementById('climbLatitude').value;
        const longitude = document.getElementById('climbLongitude').value;

        if (!name) {
            this.showToast('Введите название маршрута', true);
            return;
        }

        if (!this.currentAreaId) {
            this.showToast('Выберите район', true);
            return;
        }

        let climbData = {
            id: climbId || Date.now().toString(),
            areaId: this.currentAreaId,
            name,
            description,
            latitude: latitude || null,
            longitude: longitude || null,
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser ? this.currentUser.id : null
        };

        if (type === 'route') {
            const grade = document.getElementById('routeGrade').value;
            const length = parseInt(document.getElementById('routeLength').value);
            const sector = document.getElementById('routeSector').value.trim();
            const bolts = parseInt(document.getElementById('routeBolts').value) || 0;
            const rating = parseInt(document.getElementById('routeRating').value) || 3;

            if (!grade || !length || !sector) {
                this.showToast('Заполните все обязательные поля для трассы', true);
                return;
            }

            climbData = {
                ...climbData,
                type: 'route',
                grade,
                length,
                sector,
                bolts,
                rating // Добавляем рейтинг
            };

            let routes = getRoutes();

            if (climbId) {
                const index = routes.findIndex(r => r.id === climbId);
                if (index !== -1) {
                    routes[index] = climbData;
                }
            } else {
                routes.push(climbData);
            }

            saveRoutes(routes);
        } else {
            const grade = document.getElementById('boulderGrade').value;
            const height = parseFloat(document.getElementById('boulderHeight').value);
            const rating = parseInt(document.getElementById('boulderRating').value) || 3;

            if (!grade || !height) {
                this.showToast('Заполните все обязательные поля для боулдеринга', true);
                return;
            }

            climbData = {
                ...climbData,
                type: 'boulder',
                grade,
                height,
                rating
            };

            let boulders = getBoulders();

            if (climbId) {
                const index = boulders.findIndex(b => b.id === climbId);
                if (index !== -1) {
                    boulders[index] = climbData;
                }
            } else {
                boulders.push(climbData);
            }

            saveBoulders(boulders);
        }

        // Сохранить фото, если есть
        if (this.currentPhotoPreview) {
            let photos = getPhotos();

            // Если это редактирование и есть id у фото, обновляем существующее
            if (this.currentPhotoPreview.id && climbId) {
                const photoIndex = photos.findIndex(p => p.id === this.currentPhotoPreview.id);
                if (photoIndex !== -1) {
                    photos[photoIndex] = {
                        ...photos[photoIndex],
                        data: this.currentPhotoPreview.data,
                        fileName: this.currentPhotoPreview.fileName,
                        contentType: this.currentPhotoPreview.type,
                        markup: this.currentPhotoPreview.markup || null
                    };
                }
            } else {
                // Иначе создаем новое фото
                const newPhoto = {
                    id: Date.now().toString(),
                    climbId: climbData.id,
                    type,
                    data: this.currentPhotoPreview.data,
                    fileName: this.currentPhotoPreview.fileName,
                    contentType: this.currentPhotoPreview.type,
                    markup: this.currentPhotoPreview.markup || null,
                    createdAt: new Date().toISOString(),
                    createdBy: this.currentUser ? this.currentUser.id : null
                };
                photos.push(newPhoto);
            }

            savePhotos(photos);
        }

        this.showToast(climbId ? 'Маршрут обновлен' : 'Маршрут добавлен');
        this.hideDialog('climbDialog');
        this.showClimbsInArea(this.currentAreaId);
        this.loadAllOnMap();
    }

    showDeleteConfirmation(itemId, type) {
        let title = '';
        let text = '';

        if (type === 'area') {
            const area = getAreas().find(a => a.id === itemId);
            title = `Удалить район "${area?.name}"?`;
            text = 'Это действие невозможно отменить. Все связанные маршруты и фотографии также будут удалены.';
        } else if (type === 'route' || type === 'boulder') {
            const climb = type === 'route'
                ? getRoutes().find(r => r.id === itemId)
                : getBoulders().find(b => b.id === itemId);
            title = `Удалить маршрут "${climb?.name}"?`;
            text = 'Это действие невозможно отменить. Все связанные фотографии также будут удалены.';
        }

        document.getElementById('confirmDialogTitle').textContent = title;
        document.getElementById('confirmDialogSubtitle').textContent = 'Подтвердите удаление';
        document.getElementById('confirmDialogText').innerHTML = text;

        this.deleteCallback = () => {
            if (type === 'area') {
                this.deleteArea(itemId);
            } else if (type === 'route' || type === 'boulder') {
                this.deleteClimb(itemId, type);
            }
        };

        this.showDialog('confirmDialog');
    }

    deleteArea(areaId) {
        let areas = getAreas();
        areas = areas.filter(a => a.id !== areaId);
        saveAreas(areas);

        // Удалить связанные маршруты
        let routes = getRoutes();
        routes = routes.filter(r => r.areaId !== areaId);
        saveRoutes(routes);

        // Удалить связанные боулдеринги
        let boulders = getBoulders();
        boulders = boulders.filter(b => b.areaId !== areaId);
        saveBoulders(boulders);

        // Удалить связанные фотографии
        let photos = getPhotos();
        const climbIds = [
            ...getRoutes().filter(r => r.areaId === areaId).map(r => r.id),
            ...getBoulders().filter(b => b.areaId === areaId).map(b => b.id)
        ];
        photos = photos.filter(p => !climbIds.includes(p.climbId));
        savePhotos(photos);

        this.showToast('Район удален');
        this.showAreaList();
        this.loadAllOnMap();
    }

    deleteClimb(climbId, type) {
        if (type === 'route') {
            let routes = getRoutes();
            routes = routes.filter(r => r.id !== climbId);
            saveRoutes(routes);
        } else {
            let boulders = getBoulders();
            boulders = boulders.filter(b => b.id !== climbId);
            saveBoulders(boulders);
        }

        // Удалить связанные фотографии
        let photos = getPhotos();
        photos = photos.filter(p => !(p.climbId === climbId && p.type === type));
        savePhotos(photos);

        this.showToast('Маршрут удален');
        this.showClimbsInArea(this.currentAreaId);
        this.loadAllOnMap();
    }

    loadStats() {
        const areas = getAreas();
        const routes = getRoutes();
        const boulders = getBoulders();
        const photos = getPhotos();

        document.getElementById('areasCount').textContent = areas.length;
        document.getElementById('routesCount').textContent = routes.length;
        document.getElementById('bouldersCount').textContent = boulders.length;
        document.getElementById('photosCount').textContent = photos.length;

        // Загрузить популярные районы
        this.loadPopularAreas();
    }

    loadPopularAreas() {
        const areas = getAreas();
        const popularAreasList = document.getElementById('popularAreasList');

        if (areas.length === 0) {
            popularAreasList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-mountain"></i>
                    </div>
                    <div class="empty-state-title">Нет районов</div>
                    <div class="empty-state-text">Добавьте первый скалолазный район</div>
                </div>
            `;
            return;
        }

        // Сортировка по количеству маршрутов
        const sortedAreas = areas.map(area => {
            const routeCount = getRoutes().filter(r => r.areaId === area.id).length;
            const boulderCount = getBoulders().filter(b => b.areaId === area.id).length;
            return {
                ...area,
                totalClimbs: routeCount + boulderCount
            };
        }).sort((a, b) => b.totalClimbs - a.totalClimbs)
          .slice(0, 5);

        popularAreasList.innerHTML = sortedAreas.map(area => {
            const routeCount = getRoutes().filter(r => r.areaId === area.id).length;
            const boulderCount = getBoulders().filter(b => b.areaId === area.id).length;

            return `
                <div class="list-item" data-area-id="${area.id}">
                    <div class="list-icon area">
                        <i class="fas fa-mountain"></i>
                    </div>
                    <div class="list-content">
                        <div class="list-title">${area.name}</div>
                        <div class="list-subtitle">
                            <span>${area.location}</span>
                            <span>•</span>
                            <span>${routeCount} трасс, ${boulderCount} боулдерингов</span>
                        </div>
                    </div>
                    <div class="list-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
        }).join('');

        // Добавляем обработчики кликов на районы
        document.querySelectorAll('.list-item[data-area-id]').forEach(item => {
            item.addEventListener('click', (e) => {
                const areaId = e.currentTarget.dataset.areaId;
                this.showPage('guidebooks');
                this.showClimbsInArea(areaId);
            });
        });
    }

    loadAreas() {
        const areas = getAreas();
        const areasListContent = document.getElementById('areasListContent');

        if (areas.length === 0) {
            areasListContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-mountain"></i>
                    </div>
                    <div class="empty-state-title">Нет районов</div>
                    <div class="empty-state-text">Добавьте первый скалолазный район</div>
                </div>
            `;
            return;
        }

        areasListContent.innerHTML = areas.map(area => {
            const routeCount = getRoutes().filter(r => r.areaId === area.id).length;
            const boulderCount = getBoulders().filter(b => b.areaId === area.id).length;

            return `
                <div class="list-item" data-area-id="${area.id}">
                    <div class="list-icon area">
                        <i class="fas fa-mountain"></i>
                    </div>
                    <div class="list-content">
                        <div class="list-title">${area.name}</div>
                        <div class="list-subtitle">
                            <span>${area.location}</span>
                            <span>•</span>
                            <span>${routeCount} трасс, ${boulderCount} боулдерингов</span>
                        </div>
                    </div>
                    ${this.isAdmin ? `
                    <div class="action-buttons">
                        <button class="action-btn edit-btn small" onclick="event.stopPropagation(); app.showEditAreaDialog('${area.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn small" onclick="event.stopPropagation(); app.showDeleteConfirmation('${area.id}', 'area')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    ` : ''}
                    <div class="list-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
        }).join('');

        // Добавляем обработчики кликов на районы
        document.querySelectorAll('.list-item[data-area-id]').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.action-btn')) {
                    const areaId = e.currentTarget.dataset.areaId;
                    this.showClimbsInArea(areaId);
                }
            });
        });
    }

    search(query) {
        this.searchQuery = query.toLowerCase();
        if (this.currentView === 'stats') {
            // В статистике поиск не работает
            return;
        } else if (this.currentView === 'guidebooks') {
            if (this.viewMode === 'areas') {
                this.loadAreas();
            } else if (this.viewMode === 'climbs') {
                this.loadClimbs(this.currentAreaId);
            }
        }
    }

    showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.className = `toast${isError ? ' error' : ''}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showMarkupDialogForNewPhoto(imageData, previewContainerId) {
        this.currentMarkup.tempImageData = imageData;
        this.currentMarkup.tempPreviewContainerId = previewContainerId;
        this.currentMarkup.points = [];
        this.showMarkupDialog(null, null, null);
    }

    showMarkupDialog(photoId, climbId, type) {
        this.currentMarkup.photoId = photoId;
        this.currentMarkup.climbId = climbId;
        this.currentMarkup.type = type;

        const markupImage = document.getElementById('markupImage');
        const markupContainer = document.getElementById('markupContainer');

        if (photoId) {
            const photos = getPhotos();
            const photo = photos.find(p => p.id === photoId);
            if (photo) {
                markupImage.src = photo.data;
                if (photo.markup && photo.markup.points) {
                    this.currentMarkup.points = photo.markup.points;
                } else {
                    this.currentMarkup.points = [];
                }
            }
        } else if (this.currentMarkup.tempImageData) {
            markupImage.src = this.currentMarkup.tempImageData;
            this.currentMarkup.points = [];
        } else {
            this.showToast('Нет изображения для разметки', true);
            return;
        }

        this.showDialog('markupDialog');
        this.markupMode = 'add';
        this.updateMarkupMode();

        // Инициализируем canvas для рисования линий
        this.initMarkupCanvas();

        // Рисуем текущую разметку
        this.drawMarkup();
    }

    initMarkupCanvas() {
        const canvas = document.getElementById('markupCanvas');
        if (!canvas) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        this.markupCanvas = canvas;
        this.markupCtx = canvas.getContext('2d');
    }

    drawMarkup() {
        if (!this.markupCtx) return;

        // Очищаем canvas
        this.markupCtx.clearRect(0, 0, this.markupCanvas.width, this.markupCanvas.height);

        // Рисуем линии между точками
        if (this.currentMarkup.points.length > 1) {
            this.markupCtx.beginPath();
            this.markupCtx.moveTo(
                this.currentMarkup.points[0].x * this.markupCanvas.width / 100,
                this.currentMarkup.points[0].y * this.markupCanvas.height / 100
            );

            for (let i = 1; i < this.currentMarkup.points.length; i++) {
                this.markupCtx.lineTo(
                    this.currentMarkup.points[i].x * this.markupCanvas.width / 100,
                    this.currentMarkup.points[i].y * this.markupCanvas.height / 100
                );
            }

            this.markupCtx.strokeStyle = 'red';
            this.markupCtx.lineWidth = 3;
            this.markupCtx.stroke();
        }

        // Отрисовываем точки на overlay
        const overlay = document.getElementById('markupOverlay');
        overlay.innerHTML = '';

        this.currentMarkup.points.forEach((point, index) => {
            const pointElement = document.createElement('div');
            pointElement.className = 'markup-point';
            pointElement.style.left = `${point.x}%`;
            pointElement.style.top = `${point.y}%`;
            pointElement.dataset.index = index;

            pointElement.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    this.currentMarkup.points.splice(index, 1);
                    this.drawMarkup();
                } else {
                    // Можно реализовать выделение точки
                }
            });

            overlay.appendChild(pointElement);
        });
    }

    handleMarkupClick(e) {
        if (this.markupMode !== 'add') return;

        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        this.currentMarkup.points.push({ x, y });
        this.drawMarkup();
    }

    clearMarkup() {
        this.currentMarkup.points = [];
        this.drawMarkup();
    }

    saveMarkup() {
        if (this.currentMarkup.photoId) {
            // Обновляем разметку существующей фотографии
            let photos = getPhotos();
            const photoIndex = photos.findIndex(p => p.id === this.currentMarkup.photoId);
            if (photoIndex !== -1) {
                if (!photos[photoIndex].markup) {
                    photos[photoIndex].markup = {};
                }
                photos[photoIndex].markup.points = this.currentMarkup.points;
                savePhotos(photos);
            }
        } else if (this.currentMarkup.tempImageData) {
            // Сохраняем разметку для временной фотографии
            this.currentPhotoPreview.markup = {
                points: this.currentMarkup.points
            };
        }

        this.showToast('Разметка сохранена');
        this.hideDialog('markupDialog');
    }

    reloadCurrentView() {
        if (this.currentView === 'stats') {
            this.loadStats();
        } else if (this.currentView === 'guidebooks') {
            if (this.viewMode === 'areas') {
                this.loadAreas();
            } else if (this.viewMode === 'climbs' && this.currentAreaId) {
                this.loadClimbs(this.currentAreaId);
            } else if (this.viewMode === 'climbDetails' && this.currentClimbId && this.currentClimbType) {
                this.showClimbDetails(this.currentClimbId, this.currentClimbType);
            }
        }
    }
}

// Инициализация приложения
const app = new ClimbingApp();

// Добавляем глобальные функции для использования в HTML
window.app = app;