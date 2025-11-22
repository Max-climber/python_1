import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException


# Исправлен URL: добавлено // после https:
BASE_URL = "https://www.kinopoisk.ru/lists/categories/movies/3/"

@pytest.fixture
def setup(driver):
    """Фикстура для загрузки главной страницы перед каждым тестом."""
    driver.get(BASE_URL)
    yield

# --- TEST 3 ---

def test_open_series_section(driver):
    """Переход в раздел Сериалы"""
    driver.get(BASE_URL)

    try:
        # Ждём кликабельной ссылки «Сериалы»
        series_btn = WebDriverWait(driver, 15).until(
            EC.element_to_be_clickable((By.LINK_TEXT, "Сериалы"))
        )
        series_btn.click()

        # Ждём изменения заголовка (подтверждение перехода)
        WebDriverWait(driver, 15).until(
            EC.title_contains("Сериалы")
        )

        # Проверяем, что URL содержит ожидаемый путь
        assert "/lists/categories/movies/3/" in driver.current_url, \
            f"Ожидался URL с '/lists/categories/movies/3/', но получен: {driver.current_url}"

    except TimeoutException:
        pytest.fail("Не удалось перейти в раздел 'Сериалы' за 15 сек")
