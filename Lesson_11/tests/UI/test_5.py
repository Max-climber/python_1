from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Инициализация драйвера
driver = webdriver.Chrome()  # Убедитесь, что ChromeDriver в PATH
driver.maximize_window()
wait = WebDriverWait(driver, 10)

try:
    # Шаг 1: Открыть главную страницу Кинопоиска
    print("Шаг 1: Открываем Кинопоиск...")
    driver.get("https://www.kinopoisk.ru/")

    wait.until(lambda d: d.title != "")
    assert "Кинопоиск" in driver.title, "Заголовок не содержит «Кинопоиск»"
    print("✓ Шаг 1 пройден: сайт открыт.")

    # Шаг 2: Перейти на вкладку «Фильмы»
    print("Шаг 2: Переходим на страницу «Фильмы»...")
    driver.get("https://www.kinopoisk.ru/lists/categories/movies/1/")

    wait.until(EC.url_contains("/lists/categories/movies/1/"))
    print("✓ Шаг 2 пройден: страница «Фильмы» загружена.")

    # Шаг 3: Найти поле поиска по name="kp_query"
    print("Шаг 3: Ищем поле поиска...")
    search_input = wait.until(
        EC.presence_of_element_located((By.NAME, "kp_query"))
    )
    print("✓ Шаг 3 пройден: поле поиска найдено.")

    # Шаг 4: Ввести название фильма "Happy End"
    movie_title = "Happy End"
    print(f'Шаг 4: Вводим в поиск "{movie_title}"...')
    search_input.clear()
    search_input.send_keys(movie_title)

    # Ожидание появления результатов поиска
    print("Ожидание появления результатов поиска...")
    results_container = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "div[data-testid='search-results']"))
    )

    # Шаг 5: Получить и вывести результаты поиска
    print("Шаг 5: Получаем результаты поиска...")

    # Ждём, пока появятся карточки результатов
    result_elements = wait.until(
        EC.presence_of_all_elements_located(
            (By.CSS_SELECTOR, "a[data-testid='search-result-card']")
        )
    )

    if result_elements:
        print(f"\nНайдено {len(result_elements)} результатов:")
        for idx, elem in enumerate(result_elements[:5], 1):  # Выводим первые 5
            # Ждём видимости элемента и получения текста
            wait.until(EC.visibility_of(elem))
            title = elem.text.strip()
            if title:
                print(f"{idx}. {title}")
            else:
                print(f"{idx}. (пустой заголовок)")
    else:
        print("Результаты найдены, но заголовки отсутствуют.")

except TimeoutException as e:
    print(f"Ошибка ожидания: элемент не появился в отведённое время. {e}")
except NoSuchElementException as e:
    print(f"Элемент не найден в DOM: {e}")
except AssertionError as e:
    print(f"Проверка утверждения не пройдена: {e}")
except Exception as e:
    print(f"Произошла непредвиденная ошибка: {e}")

finally:
    # Закрываем браузер
    print("\nЗакрываем браузер...")
    driver.quit()