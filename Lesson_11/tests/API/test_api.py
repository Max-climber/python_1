import pytest
import requests

BASE = "https://www.kinopoisk.ru/api/"



# --- TEST 1: API отдаёт HTML вместо JSON ---
def test_api_returns_html():
    url = BASE + "v1/content/list?type=movie&page=1&perPage=20"
    response = requests.get(url)

    assert response.status_code == 200
    assert "<html" in response.text.lower() or "<script" in response.text.lower()


# --- TEST 2: API требует авторизацию ---
def test_api_requires_auth():
    url = BASE + "v1/search?query=Интерстеллар"
    response = requests.get(url)

    assert response.status_code == 200  # сервак любит давать 200 даже на ошибки
    # Проверяем редирект на SSO
    assert "sso" in response.text or "captcha" in response.text.lower()


# --- TEST 3: API не отдаёт JSON без токена ---
def test_no_json_available():
    url = BASE + "v1/content/258687"
    response = requests.get(url)

    with pytest.raises(Exception):
        response.json()  # гарантированно упадёт


# --- TEST 4: CAPTCHA защита включена ---
def test_captcha_protection():
    url = BASE + "v1/content/filters/genres"
    response = requests.get(url)

    assert response.status_code == 200
    assert "captcha" in response.text.lower() or "yandex.ru" in response.text.lower()


# --- TEST 5: Негативная проверка (логин без токена невозможен) ---
def test_auth_impossible_without_token():
    url = BASE + "v1/auth/login?login=x&password=y"
    response = requests.get(url)

    assert response.status_code == 200
    assert "sso" in response.text.lower() or "captcha" in response.text.lower()
