import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import allure  # Импорт Allure

# URL:
BASE_URL = "https://www.kinopoisk.ru/?utm_referrer=www.yandex.ru"

@pytest.fixture
def setup(driver):
    """Фикстура для загрузки главной страницы перед каждым тестом."""
    driver.get(BASE_URL)
    yield

# --- TEST 1 ---
@allure.feature("Главная страница")  # Категория теста
@allure.story("Загрузка главной страницы")  # Сценарий теста
@allure.title("Проверка загрузки главной страницы")  # Название теста в отчёте
@allure.description(
    "Проверяет, что главная страница КиноПоиска загружается и содержит корректное название в заголовке.")  # Описание теста
def test_homepage_loads(driver, setup):
    """Проверка загрузки главной страницы"""
    try:
        with allure.step("Ожидание появления header на странице"):  # Шаг в отчёте
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "header"))
            )

        with allure.step("Проверка заголовка страницы"):  # Шаг в отчёте
            # Приводим заголовок страницы и ожидаемую подстроку к нижнему регистру
            assert "кинопоиск" in driver.title.lower(), \
                f"Заголовок страницы не содержит 'КиноПоиск'. Текущий заголовок: {driver.title}"

    except TimeoutException:
        with allure.step("Ошибка: страница не загрузилась за 15 секунд"):  # Шаг при ошибке
            pytest.fail("Главная страница не загрузилась за 15 секунд")

    except AssertionError as e:
        with allure.step("Ошибка проверки заголовка страницы"):  # Шаг при ошибке assert
            pytest.fail(str(e))

