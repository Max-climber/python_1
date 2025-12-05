import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class Config:
    """Конфигурация приложения"""
    # Telegram
    BOT_TOKEN: str = "8549106969:AAFYsQtdUG79d_kuLbXiLcLzb0w4gp9qOho"
    WEBAPP_URL: str = "https://github.com/erupto15/python_1/tree/282f1001d0f6f6c6953a52315c681b2ad36fcdcd/climbing-guidebook"  # Замените на свой URL

    # База данных (опционально)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///climbing.db")

    # Настройки приложения
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")

    # API ключи (для карт и т.д.)
    MAPBOX_TOKEN: Optional[str] = os.getenv("MAPBOX_TOKEN")
    OPENWEATHER_API_KEY: Optional[str] = os.getenv("OPENWEATHER_API_KEY")

    # Лимиты
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10 MB
    MAX_ROUTES_PER_PAGE: int = 50

    @property
    def webhook_url(self) -> str:
        """URL для вебхуков"""
        return f"{self.WEBAPP_URL.rstrip('/')}/webhook"


# Создаем конфигурацию
config = Config()