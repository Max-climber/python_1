import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import allure  # Импорт Allure

# Исправлен URL: добавлено // после https:
BASE_URL = "https://www.kinopoisk.ru/lists/categories/movies/3/"

@pytest.fixture
def setup(driver):
    """Фикстура для загрузки главной страницы перед каждым тестом."""
    driver.get(BASE_URL)
    yield

# --- TEST 4 ---
@allure.feature("Навигация по сайту")
@allure.story("Переход в раздел «Сериалы»")
@allure.title("Проверка перехода в раздел «Сериалы»")
@allure.description("""Проверяет возможность перехода в раздел «Сериалы» через кликабельную ссылку и подтверждает корректность URL и заголовка страницы.""")
def test_open_series_section(driver):
    """Переход в раздел Сериалы"""
    with allure.step("Открытие базовой страницы"):
        driver.get(BASE_URL)

    try:
        with allure.step("Поиск и нажатие на ссылку «Сериалы»"):
            series_btn = WebDriverWait(driver, 15).until(
                EC.element_to_be_clickable((By.LINK_TEXT, "Сериалы"))
            )
            series_btn.click()

        with allure.step("Ожидание изменения заголовка страницы"):
            WebDriverWait(driver, 15).until(
                EC.title_contains("Сериалы")
            )

        with allure.step("Проверка корректности URL"):
            assert "/lists/categories/movies/3/" in driver.current_url, \
                f"Ожидался URL с '/lists/categories/movies/3/', но получен: {driver.current_url}"

        logger.info("✓ Тест пройден: успешно перешли в раздел «Сериалы».")

    except TimeoutException:
        with allure.step("Ошибка: не удалось выполнить переход за 15 секунд"):
            allure.attach(
                driver.get_screenshot_as_png(),
                name="Скриншот ошибки",
                attachment_type=allure.attachment_type.PNG
            )
            allure.attach(
                driver.page_source,
                name="HTML страницы при ошибке",
                attachment_type=allure.attachment_type.HTML
            )
            pytest.fail("Не удалось перейти в раздел 'Сериалы' за 15 сек")
