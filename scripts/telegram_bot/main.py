# Standard Library
import json
import os
import logging
import re
import sys

# Telegram Core
from telegram import (
    Update,
    InlineQueryResultArticle,
    InputTextMessageContent,
    MenuButtonWebApp,
    WebAppInfo,
    BotCommand,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    InlineQueryResultsButton, 
    error
)

# Telegram Extensions
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
        "❓ <b>How to use:</b>\n"
        "⌨️ Type @dgift_bot and start typing a word.\n"
        "Change Bots language 👇"
    ),
    "ru": (
        "Добро пожаловать в Dhamma Gift Bot!\n\n"
        "🔍 <b>Как использовать:</b>\n"
        "⌨️ Напишите @dgift_bot и начните печатать слово.\n"
        "Изменить язык Бота 👇"
    )
}

EXTRA_MESSAGES = {
    "ru": "Мини Приложения на Русском:\n\n🔎 Поиск\nhttp://t.me/dgift_bot/find",
    "en": "Mini Applications in English:\n\n🔎 Search\nhttp://t.me/dhammagift_bot/find"
}

# === Конфиг и Логи ===
config_path = sys.argv[1] if len(sys.argv) > 1 else "config.json"
with open(config_path, "r") as f:
    config = json.load(f)

bot_name = config.get("NAME", "default_bot")
TOKEN = config.get("TOKEN", "")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

USER_DATA_FILE = f"user_data_{bot_name}.json"
DEFAULT_LANG = "en"

# === Функции данных ===
def load_user_data() -> dict:
    if not os.path.exists(USER_DATA_FILE): return {}
    try:
        with open(USER_DATA_FILE, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e: return {}

def save_user_data(user_id: int, key: str, value: str):
    try:
        data = load_user_data()
        user_id_str = str(user_id)
        if user_id_str not in data: data[user_id_str] = {}
        data[user_id_str][key] = value
        with open(USER_DATA_FILE, "w", encoding="utf-8") as f: json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e: logger.error(f"Ошибка сохранения: {e}")

def get_user_lang(user_id: int) -> str:
    data = load_user_data()
    return data.get(str(user_id), {}).get("lang", DEFAULT_LANG)

def get_user_share_lang(user_id: int) -> str:
    data = load_user_data()
    # Если язык шейринга не задан, берем основной язык бота
    return data.get(str(user_id), {}).get("share_lang", get_user_lang(user_id))

# === Обработка текста ===
def normalize(text: str) -> str:
    if not text: return text
    text = text.lower()
    repls = [("aa", "a"), ("ii", "i"), ("uu", "u"), ('"n', "n"), ("~n", "n"), (".t", "t"), (".d", "d"), (".n", "n"), (".m", "m"), (".l", "l"), (".h", "h")]
    for p, r in repls: text = text.replace(p, r)
    return text.replace("ṁ", "m").replace("ṃ", "m").replace("ṭ", "t").replace("ḍ", "d").replace("ṇ", "n").replace("ṅ", "n").replace("ñ", "n").replace("ā", "a").replace("ī", "i").replace("ū", "u").replace(".", " ")

def load_words():
    path = os.path.join("assets", "sutta_words.txt")
    if not os.path.exists(path): return {"original_words": [], "normalized_dict": {}}
    with open(path, "r", encoding="utf-8") as f:
        words = [line.strip() for line in f if line.strip()]
        norm_dict = {}
        for w in words:
            n = normalize(w)
            if n not in norm_dict: norm_dict[n] = []
            norm_dict[n].append(w)
        return {"original_words": words, "normalized_dict": norm_dict}

def autocomplete(prefix: str, max_results: int = 29) -> list[str]:
    data = load_words()
    prefix_n = normalize(prefix)
    res = []
    for n, origs in data["normalized_dict"].items():
        if n.startswith(prefix_n): res.extend(origs)
    return sorted(list(set(res)), key=lambda x: normalize(x))[:max_results]

def uniCoder(text):
    if not text: return text
    repls = [("aa", "ā"), ("ii", "ī"), ("uu", "ū"), ('"n', "ṅ"), ("~n", "ñ"), (".t", "ṭ"), (".d", "ḍ"), (".n", "ṇ"), (".m", "ṃ"), (".l", "ḷ"), (".h", "ḥ")]
    for p, r in repls: text = text.replace(p, r)
    return text

# === Клавиатура и Ссылки ===
def create_keyboard(query: str, lang: str = "en", is_inline: bool = False) -> InlineKeyboardMarkup:
    path = "ru/" if lang == "ru" else ""
    search_url = f"https://f.dhamma.gift/{path}?p=-kn&q={query.replace(' ', '+')}"
    dict_url = f"https://dict.dhamma.gift/{path}search_html?q={query.replace(' ', '+')}"

    label_dict = "📘 Словарь" if lang == "ru" else "📘 Dictionary"
    label_site = f"Читать на 🔎 Dhamma.gift {'Ru' if lang == 'ru' else 'En'}"
    toggle_label = "Язык Ru/En" if lang == "ru" else "Lang En/Ru"

    cb_prefix = "inline_" if is_inline else ""

    keyboard = [
        [
            InlineKeyboardButton(text=toggle_label, callback_data=f"{cb_prefix}toggle_lang:{lang}:{query}"),
            InlineKeyboardButton(text=label_dict, url=dict_url),
        ],
        [
            InlineKeyboardButton(text=label_site, url=search_url),
        ]
    ]
    return InlineKeyboardMarkup(keyboard)

def format_message_with_links(text: str, query: str, lang: str = "en") -> str:
    path = "ru/" if lang == "ru" else ""
    search_url = f"https://f.dhamma.gift/{path}?p=-kn&q={query.replace(' ', '+')}"
    dict_url = f"https://dict.dhamma.gift/{path}search_html?q={query.replace(' ', '+')}"
    return f"\n{text}\n\n🔎 <a href='{search_url}'>Dhamma.gift</a> | <a href='{dict_url}'>{'📘 Словарь' if lang == 'ru' else '📘 Dictionary'}</a>"

# === Обработчики ===
async def set_menu_button(update: Update, lang: str):
    user_id = update.effective_user.id
    button_text = "DG ru" if lang == "ru" else "DG en"
    button_url = f"https://f.dhamma.gift/{'ru/' if lang == 'ru' else ''}?source=pwa"
    try:
        await update.get_bot().set_chat_menu_button(chat_id=user_id, menu_button=MenuButtonWebApp(text=button_text, web_app=WebAppInfo(url=button_url)))
    except: pass

async def start(update: Update, context: CallbackContext):
    lang = get_user_lang(update.effective_user.id)
    kb = [[InlineKeyboardButton("Русский" if lang == 'en' else "English", callback_data=f"lang_set:{lang}")]]
    await update.message.reply_text(WELCOME_MESSAGES[lang], reply_markup=InlineKeyboardMarkup(kb), parse_mode="HTML")
    await set_menu_button(update, lang)

async def handle_language_selection(update: Update, context: CallbackContext):
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id
    new_lang = 'ru' if query.data.split(':')[1] == 'en' else 'en'
    
    # Синхронизируем основной язык и язык поиска
    save_user_data(user_id, 'lang', new_lang)
    save_user_data(user_id, 'share_lang', new_lang)
    
    kb = [[InlineKeyboardButton("Русский" if new_lang == 'en' else "English", callback_data=f"lang_set:{new_lang}")]]
    await query.edit_message_text(text=WELCOME_MESSAGES[new_lang], reply_markup=InlineKeyboardMarkup(kb), parse_mode="HTML")
    await set_menu_button(update, new_lang)

# === Инлайн-режим с динамической кнопкой ===
async def inline_query(update: Update, context: CallbackContext):
    query = update.inline_query.query.strip()
    user_id = update.inline_query.from_user.id
    
    # Используем share_lang, так как именно он отвечает за контент
    share_lang = get_user_share_lang(user_id)
    interface_lang = get_user_lang(user_id)

    # Динамическая "горячая кнопка"
    path = "ru/" if share_lang == "ru" else ""
    btn_text = f"📖 Dhamma.gift {'Ru' if share_lang == 'ru' else 'En'}"
    hot_button = InlineQueryResultsButton(text=btn_text, web_app=WebAppInfo(url=f"https://f.dhamma.gift/{path}"))

    results = []
    if query:
        suggestions = autocomplete(query)
        converted = uniCoder(query)
        
        results.append(InlineQueryResultArticle(
            id="user_input",
            title=f"✏️ Send: {converted}" if interface_lang == "en" else f"✏️ Отправить: {converted}",
            input_message_content=InputTextMessageContent(format_message_with_links(converted, converted, lang=share_lang), parse_mode="HTML", disable_web_page_preview=True),
            reply_markup=create_keyboard(converted, lang=share_lang, is_inline=True)
        ))

        for idx, word in enumerate(suggestions):
            results.append(InlineQueryResultArticle(
                id=f"dict_{idx}", title=word,
                input_message_content=InputTextMessageContent(format_message_with_links(word, word, lang=share_lang), parse_mode="HTML", disable_web_page_preview=True),
                reply_markup=create_keyboard(word, lang=share_lang, is_inline=True)
            ))

    await update.inline_query.answer(results, button=hot_button, cache_time=10, is_personal=True)

async def handle_message(update: Update, context: CallbackContext):
    if not update.message or not update.message.text: return
    text = update.message.text.strip()
    share_lang = get_user_share_lang(update.effective_user.id)
    converted = uniCoder(text)
    await update.message.reply_text(format_message_with_links(converted, converted, lang=share_lang), reply_markup=create_keyboard(converted, lang=share_lang), parse_mode="HTML", disable_web_page_preview=True)

async def toggle_language(update: Update, context: CallbackContext):
    query = update.callback_query
    await query.answer()
    parts = query.data.split(':')
    is_inline = parts[0] == 'inline_toggle_lang'
    new_lang = 'ru' if parts[1] == 'en' else 'en'
    search_query = ':'.join(parts[2:])
    save_user_data(query.from_user.id, 'share_lang', new_lang)
    await query.edit_message_text(text=format_message_with_links(search_query, search_query, lang=new_lang), reply_markup=create_keyboard(search_query, lang=new_lang, is_inline=is_inline), parse_mode="HTML", disable_web_page_preview=True)

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(handle_language_selection, pattern="^lang_set:"))
    app.add_handler(InlineQueryHandler(inline_query))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_handler(CallbackQueryHandler(toggle_language, pattern=r"^(inline_)?toggle_lang:"))
    app.run_polling()

if __name__ == "__main__":
    main()


