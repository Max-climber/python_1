import pytest
import requests
import allure

BASE = "https://www.kinopoisk.ru/api/"



# --- TEST 1: API отдаёт HTML вместо JSON ---
@allure.feature("API Response Validation")
@allure.story("HTML Response Check")
@allure.title("Проверка, что API возвращает HTML вместо JSON")
def test_api_returns_html():
    with allure.step("Отправка GET-запроса к API"):
        url = BASE + "v1/content/list?type=movie&page=1&perPage=20"
        response = requests.get(url)

    assert response.status_code == 200
    assert "<html" in response.text.lower() or "<script" in response.text.lower()

    with allure.step("Проверка статуса ответа"):
        assert response.status_code == 200

    with allure.step("Проверка наличия HTML-тегов в ответе"):
        assert "<html" in response.text.lower() or "<script" in response.text.lower()

# --- TEST 2: API требует авторизацию ---
@allure.feature("Authentication")
@allure.story("Authorization Check")
@allure.title("Проверка требования авторизации API")
def test_api_requires_auth():
    with allure.step("Отправка GET-запроса к поисковому API"):
        url = BASE + "v1/search?query=Интерстеллар"
        response = requests.get(url)

    with allure.step("Проверка статуса ответа (ожидается 200)"):
        assert response.status_code == 200  # сервак любит давать 200 даже на ошибки

    with allure.step("Проверка редиректа на SSO или капчу"):
        assert "sso" in response.text or "captcha" in response.text.lower()    # Проверяем редирект на SSO



# --- TEST 3: API не отдаёт JSON без токена ---
@allure.feature("JSON Response")
@allure.story("Token Validation")
@allure.title("Проверка отсутствия JSON без токена")
def test_no_json_available():
    with allure.step("Отправка GET-запроса к контенту без токена"):
        url = BASE + "v1/content/258687"
        response = requests.get(url)

    with allure.step("Проверка невозможности декодирования JSON"):
        with pytest.raises(Exception):
            response.json()  # гарантированно упадёт


# --- TEST 4: CAPTCHA защита включена ---
@allure.feature("Security")
@allure.story("CAPTCHA Protection")
@allure.title("Проверка включения защиты CAPTCHA")
def test_captcha_protection():
    with allure.step("Отправка GET-запроса к фильтрам жанров"):
        url = BASE + "v1/content/filters/genres"
        response = requests.get(url)

    with allure.step("Проверка статуса ответа"):
        assert response.status_code == 200

    with allure.step("Проверка наличия CAPTCHA или ссылки на Яндекс"):
        assert "captcha" in response.text.lower() or "yandex.ru" in response.text.lower()


# --- TEST 5: Негативная проверка (логин без токена невозможен) ---
@allure.feature("Authentication")
@allure.story("Login Attempt")
@allure.title("Проверка невозможности логина без токена")
def test_auth_impossible_without_token():
    with allure.step("Отправка GET-запроса на авторизацию без токена"):
        url = BASE + "v1/auth/login?login=x&password=y"
        response = requests.get(url)

    with allure.step("Проверка статуса ответа"):
        assert response.status_code == 200

    with allure.step("Проверка редиректа на SSO или капчу"):
        assert "sso" in response.text.lower() or "captcha" in response.text.lower()
