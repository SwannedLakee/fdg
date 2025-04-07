import json
import os
import logging
from telegram import (
    Update,
    InlineQueryResultArticle,
    InputTextMessageContent,
    InlineKeyboardButton,
    InlineKeyboardMarkup
)
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    InlineQueryHandler,
    CallbackQueryHandler,
    filters,
    CallbackContext,
)

WELCOME_MESSAGES = {
    "en": (
        "✨ Welcome to Dhamma Gift Bot!\n\n"
        "❓ <b>How to use:</b>\n\n"
        "💬 <b>Call me in any chat or group:</b>\n"
        " ⌨️ Type <code>@dhammagift_bot</code> and start typing a word to search or sutta reference (e.g. <code>sn12.2</code>)\n\n"
        "💡 Suggestions will appear for Pali words and sutta references\n\n"
        "🤓 You can use Velthuis transliteration for diacritics: <code>.t .d .n ~n aa ii uu</code> → <code>ṭ ḍ ṇ ñ ā ī ū</code>\n\n"
        "💬 <b>In this private chat:</b>\n"
        "Simply send me a word or reference (e.g. <code>mn10</code> or <code>saariputta</code>)"
    ),
    "ru": (
        "Добро пожаловать в Dhamma Gift Bot!\n\n"
        "🔍 <b>Как использовать:</b>\n\n"
        "💬 <b>Вы можете вызвать меня в любом чате или группе:</b>\n"
        "⌨️ Напишите <code>@dhammagift_bot</code> и начните печатать слово или номер сутты (например, <code>sn12.2</code>)\n"
        "💡 Я предложу варианты палийских слов и ссылок на сутты\n\n"
        "🤓 Также Вы можете использовать транслитерацию Velthuis для диакритики: <code>.t .d .n ~n aa ii uu</code> → <code>ṭ ḍ ṇ ñ ā ī ū</code>\n\n"
        "💬 <b>В этом личном чате:</b>\n"
        "Просто отправьте мне слово или номер сутты (например, <code>mn10</code> или <code>saariputta</code>)"
    )
}

# === Настройка логирования ===
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("bot.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# === Константы ===
USER_DATA_FILE = "user_data.json"
DEFAULT_LANG = "en"  # Английский по умолчанию

# === Функции для работы с JSON-хранилищем ===
def load_user_data() -> dict:
    """Загружает данные пользователей из файла"""
    if not os.path.exists(USER_DATA_FILE):
        return {}
    
    try:
        with open(USER_DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Ошибка загрузки user_data: {e}")
        return {}

def save_user_data(user_id: int, key: str, value: str):
    """Сохраняет данные пользователя в файл"""
    try:
        data = load_user_data()
        user_id_str = str(user_id)
        
        if user_id_str not in data:
            data[user_id_str] = {}
        
        data[user_id_str][key] = value
        
        with open(USER_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Ошибка сохранения user_data: {e}")

def get_user_lang(user_id: int) -> str:
    """Возвращает сохраненный язык пользователя"""
    data = load_user_data()
    return data.get(str(user_id), {}).get("lang", DEFAULT_LANG)

# === Загрузка словаря ===
def load_words():
    try:
        path = os.path.join("assets", "sutta_words.txt")
        with open(path, "r", encoding="utf-8") as f:
            words = [line.strip() for line in f if line.strip()]
            logger.info(f"Загружено {len(words)} слов для автокомплита")
            return words
    except Exception as e:
        logger.error(f"Ошибка загрузки словаря: {e}")
        return []
 
WORDS = load_words()

def normalize(text: str) -> str:
    """Нормализация текста с учетом возможных замен"""
    if not text:
        return text
    
    text = text.lower()
    replacements = [
        ("aa", "a"), ("ii", "i"), ("uu", "u"),
        ('"n', "n"), ("~n", "n"),
        (".t", "t"), (".d", "d"), (".n", "n"),
        (".m", "m"), (".l", "l"), (".h", "h")
    ]
    for pattern, repl in replacements:
        text = text.replace(pattern, repl)
    
    return (
        text.replace("ṁ", "m").replace("ṃ", "m")
        .replace("ṭ", "t").replace("ḍ", "d")
        .replace("ṇ", "n").replace("ṅ", "n")
        .replace("ñ", "n").replace("ā", "a")
        .replace("ī", "i").replace("ū", "u")
        .replace(".", " ")
    )

def autocomplete(prefix: str, max_results: int = 29) -> list[str]:
    try:
        prefix_n = normalize(prefix)
        suggestions = [
            word for word in WORDS 
            if normalize(word).startswith(prefix_n)
        ][:max_results]
        logger.debug(f"Автокомплит для '{prefix}': найдено {len(suggestions)} вариантов")
        return suggestions
    except Exception as e:
        logger.error(f"Ошибка автокомплита: {e}")
        return []

# === Создание клавиатуры с кнопками ===
def create_keyboard(query: str, lang: str = "en", is_inline: bool = False) -> InlineKeyboardMarkup:
    base = "https://dhamma.gift"
    search_url = f"{base}/{'' if lang == 'en' else 'ru/'}?p=-kn&q={query.replace(' ', '+')}"
    dict_url = f"https://dict.dhamma.gift/{'' if lang == 'en' else 'ru/'}search_html?q={query.replace(' ', '+')}"

    label_dict = "📘 Dictionary" if lang == "en" else "📘 Словарь"
    label_site = "🔎 Dhamma.gift En" if lang == "en" else "🔎 Dhamma.gift Ru"
    toggle_label = "RU" if lang == "en" else "EN"  # Инвертировано, так как DEFAULT_LANG=en

    callback_prefix = "inline_" if is_inline else ""

    keyboard = [
        [
            InlineKeyboardButton(text=toggle_label, callback_data=f"{callback_prefix}toggle_lang:{lang}:{query}"),
            InlineKeyboardButton(text=label_dict, url=dict_url),
        ],
        [
            InlineKeyboardButton(text=label_site, url=search_url),
        ]
    ]

    return InlineKeyboardMarkup(keyboard)

# === Форматирование текста с кликабельными ссылками ===
def format_message_with_links(text: str, query: str, lang: str = "en") -> str:
    base = "https://dhamma.gift"
    search_url = f"{base}/{'' if lang == 'en' else 'ru/'}?p=-kn&q={query.replace(' ', '+')}"
    dict_url = f"https://dict.dhamma.gift/{'' if lang == 'en' else 'ru/'}search_html?q={query.replace(' ', '+')}"

    label_dict = "📘 Dictionary" if lang == "en" else "📘 Словарь"
    label_site = "🔎 Dhamma.gift" if lang == "en" else "🔎 Dhamma.gift"

    links_text = (
        f'<a href="{search_url}">{label_site}</a> | '
        f'<a href="{dict_url}">{label_dict}</a>'
    )
    return f"\n{text}\n\n{links_text}"

async def start(update: Update, context: CallbackContext):
    user = update.effective_user
    logger.info(f"Команда /start от {user.id} ({user.full_name})")

    # Получаем или устанавливаем язык по умолчанию
    user_lang = get_user_lang(user.id) or 'en'
    context.user_data["lang"] = user_lang

    keyboard = [
        [
            InlineKeyboardButton("English", callback_data="lang_set:en"),
            InlineKeyboardButton("Русский", callback_data="lang_set:ru")
        ]
    ]

    await update.message.reply_text(
        WELCOME_MESSAGES[user_lang],
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="HTML"
    )
    
async def handle_language_selection(update: Update, context: CallbackContext):
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    selected_lang = query.data.split(':')[1]

    # Сохраняем выбор языка
    save_user_data(user_id, 'lang', selected_lang)
    context.user_data['lang'] = selected_lang

    keyboard = [
        [
            InlineKeyboardButton("English", callback_data="lang_set:en"),
            InlineKeyboardButton("Русский", callback_data="lang_set:ru")
        ]
    ]

    # Редактируем сообщение с текстом на новом языке
    await query.edit_message_text(
        text=WELCOME_MESSAGES[selected_lang],
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="HTML"
    )

def uniCoder(text):
    if not text:
        return text
    replacements = [
        ("aa", "ā"), ("ii", "ī"), ("uu", "ū"),
        ('"n', "ṅ"), ("~n", "ñ"),
        (".t", "ṭ"), (".d", "ḍ"), (".n", "ṇ"),
        (".m", "ṃ"), (".l", "ḷ"), (".h", "ḥ")
    ]
    for pattern, repl in replacements:
        text = text.replace(pattern, repl)
    return text

# === Инлайн-режим ===
async def inline_query(update: Update, context: CallbackContext):
    query = update.inline_query.query.strip()
    if not query:
        return

    user_id = update.inline_query.from_user.id
    logger.info(f"Инлайн-запрос: '{query}' от {user_id}")

    # Получаем или сохраняем язык пользователя
    lang = get_user_lang(user_id)
    if not lang:
        lang = DEFAULT_LANG
        save_user_data(user_id, "lang", lang)
    
    context.user_data["lang"] = lang
    
    suggestions = autocomplete(query, max_results=29)
    results = []
    converted_text = uniCoder(query)
    
    if converted_text:
        results.append(InlineQueryResultArticle(
            id="user_input",
            title=f"✏️ Send: {converted_text}" if lang == "en" else f"✏️ Отправить: {converted_text}",
            input_message_content=InputTextMessageContent(
                format_message_with_links(converted_text, converted_text, lang=lang),
                parse_mode="HTML",
                disable_web_page_preview=True
            ),
            description="Your text with converted symbols" if lang == "en" else "Ваш текст с преобразованными символами",
            reply_markup=create_keyboard(converted_text, lang=lang, is_inline=True)
        ))

    for idx, word in enumerate(suggestions[:29]):
        results.append(InlineQueryResultArticle(
            id=f"dict_{idx}",
            title=word,
            input_message_content=InputTextMessageContent(
                format_message_with_links(word, word, lang=lang),
                parse_mode="HTML",
                disable_web_page_preview=True
            ),
            description=f"Click to send '{word}'",
            reply_markup=create_keyboard(word, lang=lang, is_inline=True)
        ))

    await update.inline_query.answer(results, cache_time=10)

# === Обработчик сообщений с защитой от None ===
async def handle_message(update: Update, context: CallbackContext):
    try:
        if not update.message or not update.message.text:
            logger.warning("Received update without message or text")
            return
            
        text = update.message.text.strip()
        user = update.effective_user
        logger.info(f"Message from {user.id}: {text}")

        # Получаем язык
        lang = get_user_lang(user.id) or DEFAULT_LANG
        
        converted_text = uniCoder(text)
        
        if converted_text == text and len(text) < 5 and text.isalpha():
            suggestions = autocomplete(text)
            if suggestions:
                reply = {
                    "en": "Possible variants:\n" + "\n".join(f"- {w}" for w in suggestions),
                    "ru": "Возможные варианты:\n" + "\n".join(f"- {w}" for w in suggestions)
                }[lang]
                await update.message.reply_text(reply)
                return

        message_text = format_message_with_links(converted_text, converted_text, lang=lang)
        keyboard = create_keyboard(converted_text, lang=lang)
        
        await update.message.reply_text(
            message_text,
            reply_markup=keyboard,
            parse_mode="HTML",
            disable_web_page_preview=True
        )
        
    except Exception as e:
        logger.error(f"Error in handle_message: {e}")

# === Обработчик переключения языка ===
async def toggle_language(update: Update, context: CallbackContext):
    query = update.callback_query
    await query.answer()
    
    try:
        user = query.from_user
        user_id = user.id
        
        # Разбираем callback_data безопасно
        try:
            parts = query.data.split(':')
            if len(parts) < 3:
                raise ValueError("Invalid callback_data format")
            
            is_inline = parts[0] == 'inline_toggle_lang'
            current_lang = parts[1]
            search_query = ':'.join(parts[2:])[:64]  # Ограничиваем длину
        except Exception as e:
            logger.error(f"Invalid callback_data: {query.data} | Error: {e}")
            await query.message.reply_text("⚠️ Произошла ошибка. Пожалуйста, попробуйте ещё раз.")
            return
        
        # Определяем новый язык
        new_lang = 'ru' if current_lang == 'en' else 'en'
        
        # Сохраняем язык
        context.user_data["lang"] = new_lang
        save_user_data(user_id, "lang", new_lang)
        
        # Формируем сообщение
        try:
            message_text = format_message_with_links(search_query, search_query, lang=new_lang)
            reply_markup = create_keyboard(search_query, lang=new_lang, is_inline=is_inline)
            
            await query.edit_message_text(
                text=message_text,
                reply_markup=reply_markup,
                parse_mode="HTML",
                disable_web_page_preview=True
            )
            logger.info(f"User {user_id} switched language to {new_lang}")
        except Exception as e:
            logger.error(f"Failed to edit message: {e}")
            await query.message.reply_text("⚠️ Не удалось обновить сообщение")

    except Exception as e:
        logger.error(f"Unexpected error in toggle_language: {e}")
        try:
            await query.message.reply_text("⚠️ Произошла непредвиденная ошибка")
        except:
            pass



# === Запуск бота ===
def main():
    logger.info("Starting bot...")
    try:
        # Загружаем токен из config.json
        try:
            with open("config.json", "r") as config_file:
                config = json.load(config_file)
                TOKEN = config.get("TOKEN", "")
                if not TOKEN:
                    raise ValueError("Token not found in config.json")
        except Exception as e:
            logger.error(f"Config load error: {e}")
            raise

        # Создаем папку assets если ее нет
        os.makedirs("assets", exist_ok=True)

        # Инициализируем бота
        app = Application.builder().token(TOKEN).build()

        # Регистрируем обработчики
        app.add_handler(CommandHandler("start", start))
        app.add_handler(CallbackQueryHandler(handle_language_selection, pattern="^lang_set:"))
        app.add_handler(InlineQueryHandler(inline_query))
        app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
        app.add_handler(CallbackQueryHandler(toggle_language, pattern=r"^toggle_lang:"))
        app.add_handler(CallbackQueryHandler(toggle_language, pattern=r"^inline_toggle_lang:"))

        # Проверяем наличие файла словаря
        if not os.path.exists(os.path.join("assets", "sutta_words.txt")):
            logger.warning("Sutta words file not found! Autocomplete will not work")

        logger.info("Bot is running and ready to handle updates")
        app.run_polling()

    except Exception as e:
        logger.critical(f"Bot failed to start: {e}")
        raise

if __name__ == "__main__":
    # Проверяем необходимые файлы
    required_files = ["config.json"]
    for file in required_files:
        if not os.path.exists(file):
            logger.error(f"Critical file missing: {file}")
            exit(1)
    
    # Запускаем бота
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.critical(f"Fatal error: {e}")