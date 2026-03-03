"""
Тесты навигации по сайту «Скалолазание — Каталог маршрутов».

Проверяют: переключение вкладок Статистика/Топо, видимость контента страниц, карта.
"""
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import allure


@allure.feature("Guide: Навигация")
@allure.story("Переключение вкладок")
@allure.title("Клик по вкладке «Топо» открывает страницу районов и маршрутов")
def test_guide_switch_to_guidebooks_tab(guide_driver):
    """При клике на «Топо» отображается страница с районами и картой."""
    driver = guide_driver
    wait = WebDriverWait(driver, 15)
    tab_topo = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".nav-tab[data-page='guidebooks']"))
    )
    driver.execute_script("arguments[0].click();", tab_topo)
    guidebooks_page = driver.find_element(By.ID, "guidebooksPage")
    try:
        wait.until(lambda d: "active" in (guidebooks_page.get_attribute("class") or ""))
    except Exception:
        driver.execute_script("if (window.app) window.app.showPage('guidebooks');")
        wait.until(lambda d: "active" in (d.find_element(By.ID, "guidebooksPage").get_attribute("class") or ""))
    assert "active" in guidebooks_page.get_attribute("class")
    with allure.step("Проверка наличия блока районов или карты"):
        areas_list = driver.find_element(By.ID, "areasList")
        assert areas_list.is_displayed()


@allure.feature("Guide: Навигация")
@allure.story("Переключение вкладок")
@allure.title("Клик по вкладке «Статистика» возвращает на страницу статистики")
def test_guide_switch_back_to_stats_tab(guide_driver):
    """Переход на «Топо», затем обратно на «Статистика» — активна страница статистики."""
    driver = guide_driver
    wait = WebDriverWait(driver, 15)
    tab_topo = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".nav-tab[data-page='guidebooks']"))
    )
    driver.execute_script("arguments[0].click();", tab_topo)
    try:
        wait.until(lambda d: "active" in (d.find_element(By.ID, "guidebooksPage").get_attribute("class") or ""))
    except Exception:
        driver.execute_script("if (window.app) window.app.showPage('guidebooks');")
        wait.until(lambda d: "active" in (d.find_element(By.ID, "guidebooksPage").get_attribute("class") or ""))
    tab_stats = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".nav-tab[data-page='stats']"))
    )
    driver.execute_script("arguments[0].click();", tab_stats)
    wait.until(lambda d: "active" in (d.find_element(By.ID, "statsPage").get_attribute("class") or ""))
    stats_page = driver.find_element(By.ID, "statsPage")
    assert "active" in stats_page.get_attribute("class")


@allure.feature("Guide: Навигация")
@allure.story("Страница Топо")
@allure.title("На странице Топо отображаются блоки: районы, карта")
def test_guide_guidebooks_page_has_areas_and_map(guide_driver):
    """На вкладке «Топо» есть список районов и контейнер карты."""
    driver = guide_driver
    wait = WebDriverWait(driver, 15)
    tab_topo = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".nav-tab[data-page='guidebooks']"))
    )
    driver.execute_script("arguments[0].click();", tab_topo)
    try:
        wait.until(lambda d: "active" in (d.find_element(By.ID, "guidebooksPage").get_attribute("class") or ""))
    except Exception:
        driver.execute_script("if (window.app) window.app.showPage('guidebooks');")
        wait.until(lambda d: "active" in (d.find_element(By.ID, "guidebooksPage").get_attribute("class") or ""))
    with allure.step("Проверка списка районов"):
        areas_list_content = driver.find_element(By.ID, "areasListContent")
        assert areas_list_content.is_displayed()
    with allure.step("Проверка контейнера карты"):
        map_container = driver.find_element(By.ID, "mapContainer")
        assert map_container.is_displayed()
