"""
Общая конфигурация pytest для тестирования архитектуры проекта.

- driver: фикстура Selenium WebDriver (Chrome) для UI-тестов.
- GUIDE_BASE_URL: URL сайта «Скалолазание — Каталог маршрутов» (guide).
  По умолчанию file:// путь к index.html; можно переопределить через env GUIDE_BASE_URL
  (например, http://localhost:8000 при запуске своего сервера).
"""
import os
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service


# Корень репозитория: родитель каталога Lesson_11
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_GUIDE_INDEX = os.path.join(_REPO_ROOT, "guide", "index.html")


def _get_guide_base_url():
    url = os.environ.get("GUIDE_BASE_URL", "").strip()
    if url:
        return url.rstrip("/")
    if os.path.isfile(_GUIDE_INDEX):
        return "file://" + _GUIDE_INDEX
    return "file://" + _GUIDE_INDEX


GUIDE_BASE_URL = _get_guide_base_url()


@pytest.fixture(scope="session")
def guide_base_url():
    """URL главной страницы guide (каталог маршрутов)."""
    return GUIDE_BASE_URL


@pytest.fixture(scope="function")
def driver():
    """Экземпляр Chrome WebDriver для UI-тестов. Один браузер на тест."""
    opts = Options()
    opts.add_argument("--headless")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    drv = webdriver.Chrome(options=opts)
    drv.set_page_load_timeout(30)
    try:
        yield drv
    finally:
        drv.quit()


@pytest.fixture(scope="function")
def guide_driver(driver):
    """Драйвер с уже открытой главной страницей guide (каталог маршрутов)."""
    driver.get(GUIDE_BASE_URL)
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.by import By
    wait = WebDriverWait(driver, 20)
    wait.until(EC.presence_of_element_located((By.ID, "statsPage")))
    # Ждём готовности приложения (window.app появляется после загрузки script.js)
    try:
        wait.until(lambda d: d.execute_script("return typeof window.app !== 'undefined';"))
    except Exception:
        pass
    yield driver
