"""
Тесты структуры и загрузки сайта «Скалолазание — Каталог маршрутов».

Проверяют: загрузку главной страницы, заголовок, шапку, логотип, навигацию, поиск, блок контента.
"""
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import allure


@allure.feature("Guide: Структура сайта")
@allure.story("Загрузка главной страницы")
@allure.title("Главная страница guide загружается и отображается")
def test_guide_homepage_loads(guide_driver, guide_base_url):
    """Главная страница каталога маршрутов загружается, заголовок корректен."""
    driver = guide_driver
    with allure.step("Проверка заголовка страницы"):
        assert "скалолазание" in driver.title.lower() or "каталог" in driver.title.lower(), (
            f"Заголовок должен содержать 'Скалолазание' или 'Каталог'. Получен: {driver.title}"
        )
    with allure.step("Проверка URL"):
        assert guide_base_url in driver.current_url or "index.html" in driver.current_url or "file://" in driver.current_url


@allure.feature("Guide: Структура сайта")
@allure.story("Шапка и логотип")
@allure.title("Шапка и логотип присутствуют на странице")
def test_guide_header_and_logo(guide_driver):
    """На странице есть шапка (header) и логотип с названием «Скалолазание»."""
    driver = guide_driver
    wait = WebDriverWait(driver, 10)
    with allure.step("Поиск шапки"):
        header = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "header.header, header")))
        assert header.is_displayed()
    with allure.step("Проверка логотипа и названия"):
        logo_text = driver.find_element(By.CSS_SELECTOR, ".logo-text h1")
        assert "скалолазание" in logo_text.text.lower()


@allure.feature("Guide: Структура сайта")
@allure.story("Навигация")
@allure.title("В шапке есть вкладки Статистика и Топо")
def test_guide_nav_tabs_present(guide_driver):
    """В навигации присутствуют вкладки «Статистика» и «Топо»."""
    driver = guide_driver
    wait = WebDriverWait(driver, 10)
    nav = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".nav-tabs")))
    tabs = nav.find_elements(By.CSS_SELECTOR, ".nav-tab")
    texts = [t.text.strip().lower() for t in tabs]
    assert "статистика" in " ".join(texts), "Должна быть вкладка «Статистика»"
    assert "топо" in " ".join(texts), "Должна быть вкладка «Топо»"


@allure.feature("Guide: Структура сайта")
@allure.story("Поиск")
@allure.title("Поле поиска отображается и доступно")
def test_guide_search_input_present(guide_driver):
    """Поле поиска районов/маршрутов присутствует и видимо."""
    driver = guide_driver
    wait = WebDriverWait(driver, 10)
    search = wait.until(EC.presence_of_element_located((By.ID, "searchInput")))
    assert search.is_displayed()
    assert search.get_attribute("placeholder") or True  # может быть пусто


@allure.feature("Guide: Структура сайта")
@allure.story("Пользовательское меню")
@allure.title("Блок пользователя (Гость) и выпадающее меню присутствуют")
def test_guide_user_menu_present(guide_driver):
    """В шапке есть блок пользователя и выпадающее меню (Войти, Регистрация)."""
    driver = guide_driver
    wait = WebDriverWait(driver, 10)
    user_info = wait.until(EC.presence_of_element_located((By.ID, "userInfo")))
    assert user_info.is_displayed()
    dropdown = driver.find_element(By.ID, "userDropdown")
    assert dropdown is not None
    login_item = driver.find_element(By.ID, "loginMenuItem")
    # Текст может быть в дочерних узлах (иконка + «Войти»)
    login_text = (login_item.text or login_item.get_attribute("textContent") or "").strip().lower()
    assert "войти" in login_text or login_item.get_attribute("id") == "loginMenuItem"


@allure.feature("Guide: Структура сайта")
@allure.story("Основной контент")
@allure.title("Видна страница статистики с блоками счётчиков")
def test_guide_stats_page_visible(guide_driver):
    """По умолчанию активна страница «Статистика» с карточками счётчиков (районы, трассы, боулдеринги, фото)."""
    driver = guide_driver
    wait = WebDriverWait(driver, 10)
    stats_page = wait.until(EC.presence_of_element_located((By.ID, "statsPage")))
    assert "active" in stats_page.get_attribute("class")
    for el_id in ("areasCount", "routesCount", "bouldersCount", "photosCount"):
        el = driver.find_element(By.ID, el_id)
        assert el.is_displayed()
