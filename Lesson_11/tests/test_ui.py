import json
import time
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


BASE = "https://hd.kinopoisk.ru/api/"


@pytest.fixture()
def driver():
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    driver.maximize_window()
    yield driver
    driver.quit()


# --------- 1. Получение списка фильмов через Chrome --------- #

def test_get_catalog(driver):
    url = BASE + "v1/content/list?type=movie&page=1&perPage=20"
    driver.get(url)
    time.sleep(2)

    # Получаем JSON напрямую из тела страницы
    data = json.loads(driver.find_element("tag name", "pre").text)

    assert "items" in data
    assert len(data["items"]) > 0
    assert "title" in data["items"][0]


# --------- 2. Поиск фильма через Chrome --------- #

def test_search_movie(driver):
    url = BASE + "v1/search?query=Интерстеллар"
    driver.get(url)
    time.sleep(2)

    data = json.loads(driver.find_element("tag name", "pre").text)

    titles = [item["title"] for item in data.get("items", [])]
    assert any("Интерстеллар" in title for title in titles)


# --------- 3. Получение карточки фильма через Chrome --------- #

def test_get_movie_card(driver):
    movie_id = "258687"
    url = BASE + f"v1/content/{movie_id}"
    driver.get(url)
    time.sleep(2)

    data = json.loads(driver.find_element("tag name", "pre").text)

    assert data["id"] == movie_id
    assert data["title"] == "Интерстеллар"
    assert "description" in data


# --------- 4. Получение жанров через Chrome --------- #

def test_get_genres(driver):
    url = BASE + "v1/content/filters/genres"
    driver.get(url)
    time.sleep(2)

    data = json.loads(driver.find_element("tag name", "pre").text)

    assert "genres" in data
    assert len(data["genres"]) > 0
    assert any(g["name"] == "Фантастика" for g in data["genres"])


# --------- 5. Авторизация (негативный тест) через Chrome --------- #

def test_auth_wrong_credentials(driver):
    url = BASE + "v1/auth/login?login=wrong_user&password=wrong_password"
    driver.get(url)
    time.sleep(2)

    data = json.loads(driver.find_element("tag name", "pre").text)

    assert "error" in data
    assert data["error"] == "invalid_credentials"
