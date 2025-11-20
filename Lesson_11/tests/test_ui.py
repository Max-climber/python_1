import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from conftest import driver  # Импорт фикстуры драйвера из conftest.py


# --- TEST 1 ---
def test_homepage_loads(driver):
    """Проверка загрузки главной страницы"""
    driver.get("https://hd.kinopoisk.ru/")

    WebDriverWait(driver, 10).until(
        EC.title_contains("КиноПоиск")
    )

    assert "КиноПоиск" in driver.title

    header = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-test='header-menu']"))
    )
    assert header.is_displayed()


# --- TEST 2 ---
def test_search_film(driver):
    """Поиск фильма через верхнее меню"""
    driver.get("https://hd.kinopoisk.ru/")

    search_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-test='header-search']"))
    )
    search_btn.click()

    search_input = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='search']"))
    )

    search_input.send_keys("Интерстеллар")

    results = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-test='entity-card-title']"))
    )
    assert len(results) > 0


# --- TEST 3 ---
def test_open_first_movie_card(driver):
    """Открытие карточки первого фильма на главной"""
    driver.get("https://hd.kinopoisk.ru/")

    cards = WebDriverWait(driver, 15).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-test='entity-card']"))
    )
    assert len(cards) > 0

    cards[0].click()

    title = WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-test='content-title']"))
    )
    assert title.is_displayed()


# --- TEST 4 ---
def test_open_series_from_menu(driver):
    """Переход в раздел Сериалы через меню"""
    driver.get("https://hd.kinopoisk.ru/")

    menu_items = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-test='header-menu'] a"))
    )

    series_btn = next((item for item in menu_items if "Сериалы" in item.text), None)
    assert series_btn is not None

    series_btn.click()

    WebDriverWait(driver, 10).until(
        EC.url_contains("series")
    )
    assert "series" in driver.current_url.lower()


# --- TEST 5 ---
def test_open_genres_page(driver):
    """Проверка перехода в раздел Жанры"""
    driver.get("https://hd.kinopoisk.ru/")

    genre_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-test='header-menu'] a[href*='genres']"))
    )
    genre_btn.click()

    category_title = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-test='content-title']"))
    )

    assert category_title.is_displayed()
