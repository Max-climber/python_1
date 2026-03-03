"""
Тесты диалогов и интерактивных элементов сайта guide.

Проверяют: открытие диалога входа через API приложения, наличие форм входа/регистрации/админа.
"""
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import allure


@allure.feature("Guide: Диалоги")
@allure.story("Диалог аутентификации")
@allure.title("Диалог входа открывается и отображается")
def test_guide_auth_dialog_opens(guide_driver):
    """Открытие диалога входа через showAuthDialog и проверка видимости."""
    driver = guide_driver
    wait = WebDriverWait(driver, 15)
    driver.execute_script("if (window.app) window.app.showAuthDialog('login');")
    auth_dialog = wait.until(EC.presence_of_element_located((By.ID, "authDialog")))
    wait.until(lambda d: "hidden" not in (auth_dialog.get_attribute("class") or ""))
    assert auth_dialog.is_displayed()


@allure.feature("Guide: Диалоги")
@allure.story("Диалог аутентификации")
@allure.title("В диалоге входа есть формы: Вход, Регистрация, Администратор")
def test_guide_auth_dialog_has_forms(guide_driver):
    """В модальном окне входа присутствуют поля для входа, регистрации и админа."""
    driver = guide_driver
    wait = WebDriverWait(driver, 15)
    driver.execute_script("if (window.app) window.app.showAuthDialog('login');")
    wait.until(lambda d: d.find_element(By.ID, "authDialog").is_displayed())
    with allure.step("Проверка формы входа"):
        driver.find_element(By.ID, "loginUsername")
        driver.find_element(By.ID, "loginPassword")
    with allure.step("Проверка формы регистрации"):
        driver.find_element(By.ID, "registerUsername")
        driver.find_element(By.ID, "registerEmail")
    with allure.step("Проверка формы администратора"):
        driver.find_element(By.ID, "adminUsername")
        driver.find_element(By.ID, "adminPassword")
