import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException


# URL
BASE_URL = "https://www.kinopoisk.ru/?utm_referrer=www.yandex.ru"

# --- TEST 2 ---
def test_search_film(driver):
    """Поиск фильма"""
    driver.get(BASE_URL)


    # Проверка загрузки главной страницы
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[name='kp_query']"))
    )

    search_input = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "input[name='kp_query']"))
    )
    search_input.send_keys("Интерстеллар")


    search_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
    )
    search_button.click()

    try:
        # Увеличенный таймаут и альтернативный селектор
        results = WebDriverWait(driver, 30).until(
            EC.presence_of_all_elements_located((
                By.XPATH,
                "//a[contains(@href, '/film/') and contains(text(), 'Интерстеллар')]"
            ))
        )
        assert len(results) > 0, "Нет результатов поиска"
        assert "Интерстеллар" in results[0].text, "Первый результат не 'Интерстеллар'"
    except TimeoutException:
        print("HTML страницы при ошибке:", driver.page_source)
        pytest.fail("Не найдены результаты поиска за 30 сек")