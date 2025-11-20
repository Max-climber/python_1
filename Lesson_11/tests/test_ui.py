import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


BASE_URL = "https://www.kinopoisk.ru/?utm_referrer=www.yandex.ru"


# --- TEST 1 ---
def test_homepage_loads(driver):
    """Проверка загрузки главной страницы"""
    driver.get(BASE_URL)

    # Ожидаем, что сайт загрузился, а не Cloudflare
    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "header"))
    )

    assert "КиноПоиск" in driver.title


# --- TEST 2 ---
def test_search_film(driver):
    """Поиск фильма"""
    driver.get(BASE_URL)

    search_input = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "input[name='kp_query']"))
    )
    search_input.send_keys("Интерстеллар")

    search_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
    )
    search_button.click()

    # Результаты поиска
    results = WebDriverWait(driver, 15).until(
        EC.presence_of_all_elements_located(
            (By.CSS_SELECTOR, "div.serp-item__content a.serp-item__title-link")
        )
    )

    assert len(results) > 0
    assert "Интерстеллар" in results[0].text


# --- TEST 3 ---
def test_open_first_movie_card(driver):
    """Открытие первой карточки фильма из рекомендованного блока"""
    driver.get(BASE_URL)

    # Карточки фильмов на главной (ролевая ссылка на фильм)
    cards = WebDriverWait(driver, 20).until(
        EC.presence_of_all_elements_located(
            (By.CSS_SELECTOR, "a[href*='/film/'][role='link']")
        )
    )

    assert len(cards) > 0

    movie_url = cards[0].get_attribute("href")
    cards[0].click()

    # Заголовок фильма
    title = WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "h1[data-tid='title']"))
    )

    assert title.is_displayed()
    assert movie_url.split("/film/")[1].split("/")[0] in driver.current_url


# --- TEST 4 ---
def test_open_series_section(driver):
    """Переход в раздел Сериалы"""
    driver.get(BASE_URL)

    series_btn = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.LINK_TEXT, "Сериалы"))
    )
    series_btn.click()

    WebDriverWait(driver, 15).until(
        EC.title_contains("Сериалы")
    )

    assert "series" in driver.current_url


# --- TEST 5 ---
def test_open_genres_page(driver):
    """Переход в раздел Жанры"""
    driver.get(BASE_URL)

    genres_btn = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.LINK_TEXT, "Жанры"))
    )
    genres_btn.click()

    title = WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "h1[data-tid='title']"))
    )

    assert title.is_displayed()
    assert "genres" in driver.current_url
