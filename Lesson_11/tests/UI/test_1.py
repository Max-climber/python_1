import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# URL:
BASE_URL = "https://www.kinopoisk.ru/?utm_referrer=www.yandex.ru"

@pytest.fixture
def setup(driver):
    """Фикстура для загрузки главной страницы перед каждым тестом."""
    driver.get(BASE_URL)
    yield

# --- TEST 1 ---
def test_homepage_loads(driver, setup):
    """Проверка загрузки главной страницы"""
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "header"))
        )
        # Приводим заголовок страницы и ожидаемую подстроку к нижнему регистру
        assert "кинопоиск" in driver.title.lower(), \
            f"Заголовок страницы не содержит 'КиноПоиск'. Текущий заголовок: {driver.title}"
    except TimeoutException:
        pytest.fail("Главная страница не загрузилась за 15 секунд")