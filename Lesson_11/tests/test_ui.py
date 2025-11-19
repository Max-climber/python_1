import json
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


BASE = "https://hd.kinopoisk.ru/api/"


@pytest.fixture()
def driver():
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    driver.maximize_window()
    yield driver
    driver.quit()


def wait_json(driver):
    """Ждём появления <pre> с JSON и возвращаем его как dict"""
    pre = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, "pre"))
    )
    return json.loads(pre.text)


# --------- 1. Получение списка фильмов --------- #

def test_get_catalog(driver):
    url = BASE + "v1/content/list?type=movie&page=1&perPage=20"
    driver.get(url)

    data = wait_json(driver)

    assert "items" in data
    assert len(data["items"]) > 0
    assert "title" in data["items"][0]


# --------- 2. Поиск фильма --------- #

def test_search_movie(driver):
    url = BASE + "v1/search?query=Интерстеллар"
    driver.get(url)

    data = wait_json(driver)

    titles = [item["title"] for item in data.get("items", [])]
    assert any("Интерстеллар" in title for title in titles)


# --------- 3. Получение карточки фильма --------- #

def test_get_movie_card(driver):
    movie_id = "258687"
    url = BASE + f"v1/content/{movie_id}"
    driver.get(url)

    data = wait_json(driver)

    assert str(data["id"]) == movie_id
    assert data["title"] == "Интерстеллар"
    assert "description" in data


# --------- 4. Получение жанров --------- #

def test_get_genres(driver):
    url = BASE + "v1/content/filters/genres"
    driver.get(url)

    data = wait_json(driver)

    assert "genres" in data
    assert len(data["genres"]) > 0
    assert any(g["name"] == "Фантастика" for g in data["genres"])


# --------- 5. Негативный тест на авторизацию --------- #

def test_auth_wrong_credentials(driver):
    url = BASE + "v1/auth/login?login=wrong_user&password=wrong_password"
    driver.get(url)

    data = wait_json(driver)

    assert "error" in data
    assert data["error"] == "invalid_credentials"
