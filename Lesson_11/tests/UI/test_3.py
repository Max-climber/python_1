import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
import logging
import time

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)



# Фикстура: инициализация и закрытие драйвера
@pytest.fixture(scope="module")
def driver():
    try:
        drv = webdriver.Chrome()
        drv.maximize_window()
        logger.info("Браузер запущен.")
        yield drv
    except WebDriverException as e:
        logger.error(f"Ошибка при запуске WebDriver: {e}")
        pytest.fail(f"Не удалось запустить браузер: {e}")
    finally:
        logger.info("Закрываем браузер...")
        drv.quit()



# Тест 1: Открыть главную страницу Кинопоиска
def test_open_kinopoisk_homepage(driver):
    logger.info("Тест 1: Открываем главную страницу Кинопоиска...")
    driver.get("https://www.kinopoisk.ru/")

    try:
        wait = WebDriverWait(driver, 10)
        wait.until(lambda d: d.title != "")
        assert "Кинопоиск" in driver.title, "Заголовок не содержит «Кинопоиск»"
        logger.info("✓ Тест 1 пройден: сайт открыт.")
    except (TimeoutException, AssertionError) as e:
        logger.error(f"Тест 1 не пройден: {e}")
        pytest.fail(str(e))




# Тест 2: Перейти на вкладку «Фильмы»
def test_navigate_to_movies_tab(driver):
    logger.info("Тест 2: Переходим на страницу «Фильмы»...")
    driver.get("https://www.kinopoisk.ru/lists/categories/movies/1/")

    try:
        wait = WebDriverWait(driver, 10)
        wait.until(EC.url_contains("/lists/categories/movies/1/"))
        logger.info("✓ Тест 2 пройден: страница «Фильмы» загружена.")
    except TimeoutException as e:
        logger.error(f"Тест 2 не пройден: URL не соответствует ожидаемому. {e}")
        pytest.fail(str(e))




# Тест 3: Найти поле поиска
def test_find_search_input(driver):
    logger.info("Тест 3: Ищем поле поиска...")
    try:
        wait = WebDriverWait(driver, 10)
        search_input = wait.until(
            EC.presence_of_element_located((By.NAME, "kp_query"))
        )
        logger.info("✓ Тест 3 пройден: поле поиска найдено.")
        return search_input
    except TimeoutException as e:
        logger.error(f"Тест 3 не пройден: поле поиска не найдено. {e}")
        pytest.fail(str(e))




# Тест 4: Ввести запрос и выполнить поиск
def test_search_movie(driver):
    search_input = test_find_search_input(driver)
    movie_title = "1+1"
    logger.info(f'Тест 4: Вводим в поиск "{movie_title}" и выполняем поиск...')

    try:
        # Очищаем поле и вводим запрос
        search_input.clear()
        search_input.send_keys(movie_title)
        search_input.submit()

        # Ждём полной загрузки страницы
        WebDriverWait(driver, 5).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )

        # Проверяем, что перешли на страницу поиска
        assert "search" in driver.current_url, "Не произошёл переход на страницу поиска"

        # Увеличенный таймаут и более гибкий селектор
        wait = WebDriverWait(driver, 20)
        results_container = wait.until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, "section.search-results")  # Актуальный селектор
            )
        )

        # Дополнительно проверяем видимость хотя бы одного результата
        wait.until(
            EC.visibility_of_any_elements_located(
                (By.CSS_SELECTOR, "div.search-result-card")
            )
        )

        logger.info("✓ Тест 4 пройден: результаты поиска загружены.")


    except TimeoutException as e:
        logger.error(f"Тест 4 не пройден: не удалось дождаться результатов. {e}")
        # Отладочный вывод
        logger.info(f"Текущий URL: {driver.current_url}")
        logger.info(f"HTML страницы:\n{driver.page_source[:2000]}...")  # Первые 2000 символов
        pytest.fail(str(e))
    except AssertionError as e:
        logger.error(f"Тест 4 не пройден: проверка URL. {e}")
        pytest.fail(str(e))




# Тест 5: Проверить и вывести результаты
def test_check_search_results(driver):
    logger.info("Тест 5: Проверяем результаты поиска...")

    try:
        wait = WebDriverWait(driver, 20)

        # Ищем карточки результатов (используем более устойчивый селектор)
        result_elements = wait.until(
            EC.presence_of_all_elements_located(
                (By.CSS_SELECTOR, "div.search-result-card a")
            )
        )

        if result_elements:
            logger.info(f"\nНайдено {len(result_elements)} результатов:")
            for idx, elem in enumerate(result_elements[:5], 1):
                # Ждём видимости элемента и получаем текст
                wait.until(EC.visibility_of(elem))
                title = elem.text.strip()
                if title:
                    logger.info(f"{idx}. {title}")
                else:
                    logger.info(f"{idx}. (пустой заголовок)")
        else:
            logger.info("Результаты найдены, но заголовки отсутствуют.")

        assert len(result_elements) > 0, "Не найдено ни одного результата поиска"
        logger.info("✓ Тест 5 пройден: результаты отображены.")

    except TimeoutException as e:
        logger.error(f"Тест 5 не пройден: не удалось найти элементы результатов. {e}")
        logger.info(f"Текущий URL: {driver.current_url}")
        logger.info(f"HTML страницы:\n{driver.page_source[:2000]}...")
        pytest.fail(str(e))
    except AssertionError as e:
        logger.error(f"Тест 5 не пройден: {e}")
        pytest.fail(str(e))