import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import allure  # Импорт Allure

# URL
BASE_URL = "https://www.kinopoisk.ru/?utm_referrer=www.yandex.ru"


# --- TEST 2 ---
@allure.feature("Поиск контента")  # Категория теста: функционал поиска
@allure.story("Поиск фильма по названию")  # Сценарий: конкретный кейс поиска
@allure.title("Проверка поиска фильма «Интерстеллар»")  # Название теста в отчёте
@allure.description(
    """Проверяет, что поиск фильма по названию «Интерстеллар» возвращает корректные результаты.""")  # Описание теста
def test_search_film(driver):
    """Поиск фильма"""
    with allure.step("Открытие главной страницы КиноПоиска"):
        driver.get(BASE_URL)

    with allure.step("Проверка загрузки поисковой строки"):
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name='kp_query']"))
        )

    with allure.step("Ввод названия фильма в поисковую строку"):
        search_input = WebDriverWait(driver, 15).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "input[name='kp_query']"))
        )
        search_input.send_keys("Интерстеллар")

    with allure.step("Нажатие кнопки поиска"):
        search_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
        )
        search_button.click()

    try:
        with allure.step("Ожидание результатов поиска"):
            # Увеличенный таймаут и альтернативный селектор
            results = WebDriverWait(driver, 30).until(
                EC.presence_of_all_elements_located((
                    By.XPATH,
                    "//a[contains(@href, '/film/') and contains(text(), 'Интерстеллар')]"
                ))
            )

        with allure.step("Проверка наличия результатов"):
            assert len(results) > 0, "Нет результатов поиска"

        with allure.step("Проверка первого результата"):
            assert "Интерстеллар" in results[0].text, "Первый результат не 'Интерстеллар'"

    except TimeoutException:
        with allure.step("Ошибка: результаты не загрузились за 30 секунд"):
            allure.attach(
                driver.page_source,
                name="HTML страницы при ошибке",
                attachment_type=allure.attachment_type.HTML
            )
            pytest.fail("Не найдены результаты поиска за 30 сек")
