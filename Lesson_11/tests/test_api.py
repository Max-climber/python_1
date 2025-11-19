import pytest
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


BASE = "https://hd.kinopoisk.ru/api/"


@pytest.fixture
def driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )
    yield driver
    driver.quit()


# --- TEST 1 ---
def test_homepage_loads(driver):
    driver.get("https://hd.kinopoisk.ru/")

    WebDriverWait(driver, 10).until(
        EC.title_contains("КиноПоиск")
    )

    assert "КиноПоиск" in driver.title

    menu = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-test='header-menu']"))
    )
    assert len(menu) > 0


# --- TEST 2 ---
def test_search_works(driver):
    driver.get("https://hd.kinopoisk.ru/")

    search_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-test='header-search']"))
    )
    search_btn.click()

    search_input = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='search']"))
    )
    search_input.send_keys("Интерстеллар")
    search_input.send_keys(Keys.ENTER)

    results = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-test='entity-card-title']"))
    )
    assert len(results) > 0


# --- TEST 3 ---
def test_open_movie_card(driver):
    driver.get("https://hd.kinopoisk.ru/")

    cards = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-test='entity-card']"))
    )
    assert len(cards) > 0

    cards[0].click()

    title = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-test='content-title']"))
    )
    assert title.is_displayed()


# --- TEST 4 ---
def test_navigation_menu(driver):
    driver.get("https://hd.kinopoisk.ru/")

    menu_items = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-test='header-menu'] a"))
    )

    series = None
    for item in menu_items:
        if "Сериалы" in item.text:
            series = item
            break

    assert series is not None

    series.click()

    WebDriverWait(driver, 10).until(
        EC.url_contains("series")
    )

    assert "series" in driver.current_url.lower()


# --- TEST 5 (API тест) ---
def test_get_countries():
    url = BASE + "v1/content/filters/countries"

    response = requests.get(url)
    assert response.status_code == 200

    data = response.json()

    assert "countries" in data
    assert isinstance(data["countries"], list)
    assert len(data["countries"]) > 0

    country_names = [c["name"] for c in data["countries"]]
    assert "Россия" in country_names

