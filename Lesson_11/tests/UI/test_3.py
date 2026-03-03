import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
import logging
import time
import allure  # Импорт Allure

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
# Тест 3: Тест состоит из нескольких тестов

# Тест 1: Открыть главную страницу Кинопоиска
@allure.feature("Навигация")
@allure.story("Открытие главной страницы")
@allure.title("Проверка загрузки главной страницы Кинопоиска")
@allure.description("Проверяет, что главная страница Кинопоиска загружается и содержит корректное название в заголовке.")
def test_open_kinopoisk_homepage(driver):
    with allure.step("Начало теста: открытие главной страницы"):
        logger.info("Тест 1: Открываем главную страницу Кинопоиска...")
        driver.get("https://www.kinopoisk.ru/")

    with allure.step("Ожидание загрузки заголовка страницы"):
        try:
            wait = WebDriverWait(driver, 10)
            wait.until(lambda d: d.title != "")
            assert "Кинопоиск" in driver.title, "Заголовок не содержит «Кинопоиск»"
            logger.info("✓ Тест 1 пройден: сайт открыт.")
        except (TimeoutException, AssertionError) as e:
            with allure.step("Ошибка при загрузке главной страницы"):
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
                logger.error(f"Тест 1 не пройден: {e}")
                pytest.fail(str(e))


# Тест 2: Перейти на вкладку «Фильмы»
@allure.feature("Навигация")
@allure.story("Переход по разделам сайта")
@allure.title("Проверка перехода на страницу «Фильмы»")
@allure.description("Проверяет, что страница «Фильмы» загружается по корректному URL.")
def test_navigate_to_movies_tab(driver):
    with allure.step("Начало теста: переход на страницу «Фильмы»"):
        logger.info("Тест 2: Переходим на страницу «Фильмы»...")
        driver.get("https://www.kinopoisk.ru/lists/categories/movies/1/")

    with allure.step("Проверка URL страницы"):
        try:
            wait = WebDriverWait(driver, 10)
            wait.until(EC.url_contains("/lists/categories/movies/1/"))
            logger.info("✓ Тест 2 пройден: страница «Фильмы» загружена.")
        except TimeoutException as e:
            with allure.step("Ошибка: URL не соответствует ожидаемому"):
                allure.attach(
                    driver.get_screenshot_as_png(),
                    name="Скриншот ошибки",
                    attachment_type=allure.attachment_type.PNG
                )
                logger.error(f"Тест 2 не пройден: URL не соответствует ожидаемому. {e}")
                pytest.fail(str(e))


# Тест 3: Найти поле поиска
@allure.feature("Поиск")
@allure.story("Взаимодействие с поисковой формой")
@allure.title("Проверка наличия поля поиска")
@allure.description("Проверяет, что поле поиска (input[name='kp_query']) присутствует на странице.")
def test_find_search_input(driver):
    with allure.step("Начало теста: поиск поля поиска"):
        logger.info("Тест 3: Ищем поле поиска...")

    try:
        wait = WebDriverWait(driver, 10)
        search_input = wait.until(
            EC.presence_of_element_located((By.NAME, "kp_query"))
        )
        logger.info("✓ Тест 3 пройден: поле поиска найдено.")
        return search_input
    except TimeoutException as e:
        with allure.step("Ошибка: поле поиска не найдено"):
            allure.attach(
                driver.get_screenshot_as_png(),
                name="Скриншот ошибки",
                attachment_type=allure.attachment_type.PNG
            )
            logger.error(f"Тест 3 не пройден: поле поиска не найдено. {e}")
            pytest.fail(str(e))


# Тест 4: Ввести запрос и выполнить поиск
@allure.feature("Поиск")
@allure.story("Выполнение поискового запроса")
@allure.title("Проверка поиска фильма «1+1»")
@allure.description("Вводит запрос «1+1» в поисковую строку, выполняет поиск и проверяет загрузку результатов.")
def test_search_movie(driver):
    search_input = test_find_search_input(driver)
    movie_title = "1+1"

    with allure.step(f"Начало теста: ввод запроса «{movie_title}»"):
        logger.info(f'Тест 4: Вводим в поиск "{movie_title}" и выполняем поиск...')

    try:
        with allure.step("Ввод запроса и отправка формы"):
            search_input.clear()
            search_input.send_keys(movie_title)
            search_input.submit()

        with allure.step("Ожидание полной загрузки страницы"):
            WebDriverWait(driver, 5).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )

        with allure.step("Проверка перехода на страницу поиска"):
            assert "search" in driver.current_url, "Не произошёл переход на страницу поиска"

        with allure.step("Ожидание контейнера результатов поиска"):
            wait = WebDriverWait(driver, 20)
            results_container = wait.until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "section.search-results")
                )
            )

        with allure.step("Проверка видимости результатов"):
            wait.until(
                EC.visibility_of_any_elements_located(
                    (By.CSS_SELECTOR, "div.search-result-card")
                )
            )

        logger.info("✓ Тест 4 пройден: результаты поиска загружены.")

    except TimeoutException as e:
        with allure.step("Ошибка: не удалось дождаться результатов поиска"):
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
            logger.info(f"Текущий URL: {driver.current_url}")
            logger.info(f"HTML страницы:\n{driver.page_source[:2000]}...")
            logger.error(f"Тест 4 не пройден: не удалось дождаться результатов. {e}")
            pytest.fail(str(e))
    except AssertionError as e:
        with allure.step("Ошибка: проверка URL поиска"):
            logger.error(f"Тест 4 не пройден: проверка URL. {e}")
            pytest.fail(str(e))


# Тест 5: Проверить и вывести результаты
@allure.feature("Поиск")
@allure.story("Анализ результатов поиска")
@allure.title("Проверка отображения результатов поиска")
@allure.description("Проверяет наличие и видимость карточек результатов поиска, выводит первые 5 найденных элементов.")
def test_check_search_results(driver):
    with allure.step("Начало теста: проверка результатов поиска"):
        logger.info("Тест 5: Проверяем результаты поиска...")

    try:
        wait = WebDriverWait(driver, 20)

        with allure.step("Ожидание появления карточек результатов"):
            result_elements = wait.until(
                EC.presence_of_all_elements_located(
                    (By.CSS_SELECTOR, "div.search-result-card a")
                )
            )

        with allure.step("Анализ найденных результатов"):
            if result_elements:
                logger.info(f"\nНайдено {len(result_elements)} результатов:")
                titles = []
                for idx, elem in enumerate(result_elements[:5], 1):
                    # Ждём видимости элемента и получаем текст
                    wait.until(EC.visibility_of(elem))
                    title = elem.text.strip()
                    titles.append(title)
                    if title:
                        logger.info(f"{idx}. {title}")
                    else:
                        logger.info(f"{idx}. (пустой заголовок)")

                # Прикрепляем найденные заголовки в отчёт Allure
                allure.attach(
                    "\n".join(titles),
                    name="Найденные заголовки",
                    attachment_type=allure.attachment_type.TEXT
                )
            else:
                logger.info("Результаты найдены, но заголовки отсутствуют.")
                allure.attach(
                    "Результаты найдены, но заголовки отсутствуют.",
                    name="Примечание",
                    attachment_type=allure.attachment_type.TEXT
                )

        with allure.step("Проверка наличия хотя бы одного результата"):
            assert len(result_elements) > 0, "Не найдено ни одного результата поиска"
            logger.info("✓ Тест 5 пройден: результаты отображены.")

    except TimeoutException as e:
        with allure.step("Ошибка: не удалось найти элементы результатов"):
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
            logger.info(f"Текущий URL: {driver.current_url}")
            logger.info(f"HTML страницы:\n{driver.page_source[:2000]}...")
            logger.error(f"Тест 5 не пройден: не удалось найти элементы результатов. {e}")
            pytest.fail(str(e))
    except AssertionError as e:
        with allure.step("Ошибка проверки результатов поиска"):
            allure.attach(
                driver.get_screenshot_as_png(),
                name="Скриншот ошибки",
                attachment_type=allure.attachment_type.PNG
            )
            logger.error(f"Тест 5 не пройден: {e}")
            pytest.fail(str(e))
