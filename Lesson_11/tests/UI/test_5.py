import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import allure  # Импорт Allure

# Инициализация драйвера
driver = webdriver.Chrome()  # Убедитесь, что ChromeDriver в PATH
driver.maximize_window()
wait = WebDriverWait(driver, 10)


@allure.feature("Поиск контента")
@allure.story("Поиск фильма через главную страницу")
@allure.title("Проверка поиска фильма «Happy End»")
@allure.description(
    """Сценарий проверяет: открытие главной страницы, переход в раздел «Фильмы», поиск фильма «Happy End» и отображение результатов.""")
def test_search_happy_end():
    try:
        with allure.step("Шаг 1: Открыть главную страницу Кинопоиска"):
            print("Шаг 1: Открываем Кинопоиск...")
            driver.get("https://www.kinopoisk.ru/")

            wait.until(lambda d: d.title != "")
            assert "Кинопоиск" in driver.title, "Заголовок не содержит «Кинопоиск»"
            print("✓ Шаг 1 пройден: сайт открыт.")

        with allure.step("Шаг 2: Перейти на вкладку «Фильмы»"):
            print("Шаг 2: Переходим на страницу «Фильмы»...")
            driver.get("https://www.kinopoisk.ru/lists/categories/movies/1/")

            wait.until(EC.url_contains("/lists/categories/movies/1/"))
            print("✓ Шаг 2 пройден: страница «Фильмы» загружена.")

        with allure.step("Шаг 3: Найти поле поиска"):
            print("Шаг 3: Ищем поле поиска...")
            search_input = wait.until(
                EC.presence_of_element_located((By.NAME, "kp_query"))
            )
            print("✓ Шаг 3 пройден: поле поиска найдено.")

        with allure.step("Шаг 4: Ввести название фильма «Happy End»"):
            movie_title = "Happy End"
            print(f'Шаг 4: Вводим в поиск "{movie_title}"...')
            search_input.clear()
            search_input.send_keys(movie_title)

            print("Ожидание появления результатов поиска...")
            results_container = wait.until(
                EC.visibility_of_element_located((By.CSS_SELECTOR, "div[data-testid='search-results']"))
            )

        with allure.step("Шаг 5: Получить и вывести результаты поиска"):
            print("Шаг 5: Получаем результаты поиска...")

            # Ждём, пока появятся карточки результатов
            result_elements = wait.until(
                EC.presence_of_all_elements_located(
                    (By.CSS_SELECTOR, "a[data-testid='search-result-card']")
                )
            )

            if result_elements:
                print(f"\nНайдено {len(result_elements)} результатов:")
                titles = []
                for idx, elem in enumerate(result_elements[:5], 1):  # Выводим первые 5
                    # Ждём видимости элемента и получения текста
                    wait.until(EC.visibility_of(elem))
                    title = elem.text.strip()
                    titles.append(title)
                    if title:
                        print(f"{idx}. {title}")
                    else:
                        print(f"{idx}. (пустой заголовок)")

                # Прикрепляем найденные заголовки в отчёт
                allure.attach(
                    "\n".join(titles),
                    name="Найденные заголовки",
                    attachment_type=allure.attachment_type.TEXT
                )
            else:
                print("Результаты найдены, но заголовки отсутствуют.")
                allure.attach(
                    "Результаты найдены, но заголовки отсутствуют.",
                    name="Примечание",
                    attachment_type=allure.attachment_type.TEXT
                )

    except TimeoutException as e:
        with allure.step("Ошибка: элемент не появился в отведённое время"):
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
            print(f"Ошибка ожидания: элемент не появился в отведённое время. {e}")
            pytest.fail(str(e))
    except NoSuchElementException as e:
        with allure.step("Ошибка: элемент не найден в DOM"):
            allure.attach(
                driver.get_screenshot_as_png(),
                name="Скриншот ошибки",
                attachment_type=allure.attachment_type.PNG
            )
            print(f"Элемент не найден в DOM: {e}")
            pytest.fail(str(e))
    except AssertionError as e:
        with allure.step("Ошибка проверки утверждения"):
            allure.attach(
                driver.get_screenshot_as_png(),
                name="Скриншот ошибки",
                attachment_type=allure.attachment_type.PNG
            )
            print(f"Проверка утверждения не пройдена: {e}")
            pytest.fail(str(e))
    except Exception as e:
        with allure.step("Произошла непредвиденная ошибка"):
            allure.attach(
                driver.get_screenshot_as_png(),
                name="Скриншот ошибки",
                attachment_type=allure.attachment_type.PNG
            )
            print(f"Произошла непредвиденная ошибка: {e}")
            pytest.fail(str(e))