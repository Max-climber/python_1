import logging
import json
from telegram import Update, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
    CallbackQueryHandler
)
import os

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Токен бота
TOKEN = "8549106969:AAFYsQtdUG79d_kuLbXiLcLzb0w4gp9qOho"

# URL WebApp (замените на свой)
WEBAPP_URL = "https://your-domain.com/webapp/"  # Или локальный сервер для разработки


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start с меню"""
    keyboard = [
        [
            InlineKeyboardButton("🏔 Открыть гайдбук", web_app=WebAppInfo(url=WEBAPP_URL)),
        ],
        [
            InlineKeyboardButton("📍 Ближайшие районы", callback_data="nearby"),
            InlineKeyboardButton("⭐ Избранное", callback_data="favorites"),
        ],
        [
            InlineKeyboardButton("📊 Мои восхождения", callback_data="ascents"),
            InlineKeyboardButton("🔍 Поиск", callback_data="search"),
        ],
        [
            InlineKeyboardButton("❓ Помощь", callback_data="help"),
            InlineKeyboardButton("📱 О приложении", callback_data="about"),
        ]
    ]

    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "*Скалолазный гайдбук* 🧗‍♂️\n\n"
        "Полнофункциональный гайдбук в стиле Rakkup:\n"
        "• Карта скалолазных районов\n"
        "• Детали маршрутов с фото\n"
        "• Отслеживание восхождений\n"
        "• Фильтрация по сложности\n"
        "• Оффлайн-доступ\n\n"
        "Нажмите кнопку ниже, чтобы открыть приложение ↓",
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )


async def web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Получение данных из WebApp"""
    try:
        data = json.loads(update.effective_message.web_app_data.data)

        # Обработка различных типов данных
        if data.get('type') == 'ascent':
            await handle_ascent_data(update, data)
        elif data.get('type') == 'bookmark':
            await handle_bookmark_data(update, data)
        elif data.get('type') == 'comment':
            await handle_comment_data(update, data)

    except Exception as e:
        logger.error(f"Error processing web app data: {e}")
        await update.message.reply_text("Произошла ошибка при обработке данных")


async def handle_ascent_data(update: Update, data: dict):
    """Обработка данных о восхождении"""
    user_id = update.effective_user.id
    route_name = data.get('route_name', 'Неизвестный маршрут')
    grade = data.get('grade')
    date = data.get('date')

    # Здесь можно сохранить в базу данных
    await update.message.reply_text(
        f"✅ Восхождение записано!\n"
        f"Маршрут: *{route_name}*\n"
        f"Сложность: {grade}\n"
        f"Дата: {date}",
        parse_mode="Markdown"
    )


async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка нажатий кнопок"""
    query = update.callback_query
    await query.answer()

    data = query.data

    if data == "nearby":
        await query.edit_message_text(
            "📍 *Ближайшие скалолазные районы:*\n\n"
            "1. Красный Камень (15 км)\n"
            "2. Воргольские скалы (35 км)\n"
            "3. Дивногорье (80 км)\n"
            "4. Хвастовичский район (120 км)\n\n"
            "Откройте гайдбук для детальной карты.",
            parse_mode="Markdown"
        )
    elif data == "favorites":
        await query.edit_message_text(
            "⭐ *Избранные маршруты:*\n\n"
            "1. Солнечный луч (6a+)\n"
            "2. Летящая птица (6c)\n"
            "3. Стена плача (7a)\n\n"
            "Всего: 8 маршрутов",
            parse_mode="Markdown"
        )
    elif data == "ascents":
        await query.edit_message_text(
            "📊 *Статистика восхождений:*\n\n"
            "• Всего: 42 маршрута\n"
            "• Макс. сложность: 7a+\n"
            "• В этом месяце: 5\n\n"
            "Подробнее в приложении →",
            parse_mode="Markdown"
        )
    elif data == "help":
        await query.edit_message_text(
            "❓ *Помощь по использованию:*\n\n"
            "*Основные функции:*\n"
            "1. Открытие гайдбука\n"
            "2. Просмотр маршрутов\n"
            "3. Запись восхождений\n"
            "4. Добавление в избранное\n"
            "5. Просмотр на карте\n\n"
            "Для поддержки: @support",
            parse_mode="Markdown"
        )
    elif data == "about":
        await query.edit_message_text(
            "📱 *Скалолазный гайдбук*\n\n"
            "Версия: 1.0.0\n"
            "Аналог: Rakkup Guidebooks\n"
            "Разработчик: @yourusername\n\n"
            "Функции:\n"
            "• Полные описания маршрутов\n"
            "• Фото и топосы\n"
            "• Оффлайн-режим\n"
            "• GPS навигация\n"
            "• Статистика\n\n"
            "© 2024 Все права защищены",
            parse_mode="Markdown"
        )


async def search_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Поиск маршрутов"""
    args = context.args
    if not args:
        await update.message.reply_text(
            "Использование: /search [название или сложность]\n"
            "Пример: /search 6a или /search солнечный"
        )
        return

    search_term = " ".join(args)
    await update.message.reply_text(
        f"🔍 *Результаты поиска:* '{search_term}'\n\n"
        "1. Солнечный луч (6a+)\n"
        "2. Луч надежды (6b)\n"
        "3. Утренний луч (5c)\n\n"
        "Откройте гайдбук для детальной информации.",
        parse_mode="Markdown"
    )


async def my_ascents(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Мои восхождения"""
    await update.message.reply_text(
        "📈 *Ваша статистика:*\n\n"
        "• Всего восхождений: 42\n"
        "• В этом году: 15\n"
        "• Макс. сложность: 7a+\n"
        "• Любимый район: Красный Камень\n\n"
        "Откройте гайдбук для детального отчета.",
        parse_mode="Markdown"
    )


async def add_route(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Добавление нового маршрута"""
    await update.message.reply_text(
        "Добавление нового маршрута доступно в WebApp.\n"
        "Откройте гайдбук и нажмите кнопку '+ Добавить'."
    )


def main():
    """Запуск бота"""
    # Создаем Application
    application = Application.builder().token(TOKEN).build()

    # Регистрация обработчиков
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("search", search_command))
    application.add_handler(CommandHandler("ascents", my_ascents))
    application.add_handler(CommandHandler("add", add_route))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data))

    # Команда help
    application.add_handler(CommandHandler("help", button_callback))

    # Запуск
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()