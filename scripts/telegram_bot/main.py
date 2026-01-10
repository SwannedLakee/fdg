# Standard Library
import json
import os
import logging
import re
import sys
import urllib.parse

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

# === Константы сообщений ===
WELCOME_MESSAGES = {
    "en": "✨ Welcome to Dhamma Gift Bot!\n\nChange language 👇",
    "ru": "Добро пожаловать в Dhamma Gift Bot!\n\nИзменить язык 👇"
}

# === Загрузка конфига ===
config_path = sys.argv[1] if len(sys.argv) > 1 else "config.json"
with open(config_path, "r") as f:
    config = json.load(f)

bot_name = config.get("NAME", "default_bot")
TOKEN = config.get("TOKEN", "")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

USER_DATA_FILE = f"user_data_{bot_name}.json"
DEFAULT_LANG = "en"

# === Работа с данными ===
def load_user_data() -> dict:
    if not os.path.exists(USER_DATA_FILE): return {}
    try:
        with open(USER_DATA_FILE, "r", encoding="utf-8") as f: return json.load(f)
    except: return {}

def save_user_data(user_id: int, key: str, value: str):
    data = load_user_data()
    u_id = str(user_id)
    if u_id not in data: data[u_id] = {}
    data[u_id][key] = value
    with open(USER_DATA_FILE, "w", encoding="utf-8") as f: json.dump(data, f, indent=2, ensure_ascii=False)

def get_user_lang(user_id: int) -> str:
    return load_user_data().get(str(user_id), {}).get("lang", DEFAULT_LANG)

def get_user_share_lang(user_id: int) -> str:
    data = load_user_data().get(str(user_id), {})
    return data.get("share_lang", data.get("lang", DEFAULT_LANG))

# === Обработка текста ===
def normalize(text: str) -> str:
    if not text: return text
    text = text.lower()
    repls = [("aa", "a"), ("ii", "i"), ("uu", "u"), ('"n', "n"), ("~n", "n"), (".t", "t"), (".d", "d"), (".n", "n"), (".m", "m"), (".l", "l"), (".h", "h")]
    for p, r in repls: text = text.replace(p, r)
    return text.replace("ā", "a").replace("ī", "i").replace("ū", "u").replace("ñ", "n").replace(".", " ")

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

# === Клавиатуры ===
def create_keyboard(query: str, lang: str = "en", is_inline: bool = False) -> InlineKeyboardMarkup:
    path = "ru/" if lang == "ru" else ""
    search_url = f"https://f.dhamma.gift/{path}?p=-kn&q={urllib.parse.quote_plus(query)}"
    dict_url = f"https://dict.dhamma.gift/{path}search_html?q={urllib.parse.quote_plus(query)}"
    
    label_dict = "📘 Словарь" if lang == "ru" else "📘 Dictionary"
label_site = f"{'Читать на' if lang == 'ru' else 'Read at'} 🔎 Dhamma.gift {'Ru' if lang == 'ru' else 'En'}"
    toggle_label = "Язык Ru/En" if lang == "ru" else "Lang En/Ru"
    cb_prefix = "inline_" if is_inline else ""

    return InlineKeyboardMarkup([
        [InlineKeyboardButton(toggle_label, callback_data=f"{cb_prefix}toggle_lang:{lang}:{query}"),
         InlineKeyboardButton(label_dict, url=dict_url)],
        [InlineKeyboardButton(label_site, url=search_url)]
    ])

def format_message_with_links(text: str, query: str, lang: str = "en") -> str:
    path = "ru/" if lang == "ru" else ""
    search_url = f"https://f.dhamma.gift/{path}?p=-kn&q={urllib.parse.quote_plus(query)}"
    dict_url = f"https://dict.dhamma.gift/{path}search_html?q={urllib.parse.quote_plus(query)}"
    label_dict = "📘 Словарь" if lang == "ru" else "📘 Dictionary"
    return f"\n{text}\n\n🔎 <a href='{search_url}'>Dhamma.gift</a> | <a href='{dict_url}'>{label_dict}</a>"

# === Обработчики ===
async def set_menu_button(update: Update, lang: str):
    u_id = update.effective_user.id
    b_text = "DG ru" if lang == "ru" else "DG en"
    b_url = f"https://f.dhamma.gift/{'ru/' if lang == 'ru' else ''}?source=pwa"
    try: await update.get_bot().set_chat_menu_button(chat_id=u_id, menu_button=MenuButtonWebApp(text=b_text, web_app=WebAppInfo(url=b_url)))
    except: pass

async def start(update: Update, context: CallbackContext):
    lang = get_user_lang(update.effective_user.id)
    kb = [[InlineKeyboardButton("Русский" if lang == 'en' else "English", callback_data=f"lang_set:{lang}")]]
    await update.message.reply_text(WELCOME_MESSAGES[lang], reply_markup=InlineKeyboardMarkup(kb), parse_mode="HTML")
    await set_menu_button(update, lang)

# === ИНЛАЙН РЕЖИМ ===
async def inline_query(update: Update, context: CallbackContext):
    query = update.inline_query.query.strip()
    user_id = update.inline_query.from_user.id
    
    # Теперь текст кнопки всегда следует за языком поиска (share_lang)
    current_lang = get_user_share_lang(user_id)
    
    # Текст кнопки
    action_prefix = "Открыть" if current_lang == "ru" else "Open"
    btn_text = f"🔎 {action_prefix} 📖 Dhamma.gift {'Ru' if current_lang == 'ru' else 'En'}"

    # Ссылка кнопки (с подстановкой q)
    path = "ru/" if current_lang == "ru" else ""
    if query:
        final_url = f"https://f.dhamma.gift/{path}?p=-kn&q={urllib.parse.quote_plus(query)}"
    else:
        final_url = f"https://f.dhamma.gift/{path}"

    hot_button = InlineQueryResultsButton(text=btn_text, web_app=WebAppInfo(url=final_url))

    results = []
    if query:
        suggestions = autocomplete(query)
        converted = uniCoder(query)
        
        results.append(InlineQueryResultArticle(
            id="user_input",
            title=f"✏️ Send: {converted}" if current_lang == "en" else f"✏️ Отправить: {converted}",
            input_message_content=InputTextMessageContent(format_message_with_links(converted, converted, lang=current_lang), parse_mode="HTML", disable_web_page_preview=True),
            reply_markup=create_keyboard(converted, lang=current_lang, is_inline=True)
        ))

        for idx, word in enumerate(suggestions):
            results.append(InlineQueryResultArticle(
                id=f"dict_{idx}", title=word,
                input_message_content=InputTextMessageContent(format_message_with_links(word, word, lang=current_lang), parse_mode="HTML", disable_web_page_preview=True),
                reply_markup=create_keyboard(word, lang=current_lang, is_inline=True)
            ))

    await update.inline_query.answer(results, button=hot_button, cache_time=0, is_personal=True)

async def toggle_language(update: Update, context: CallbackContext):
    query = update.callback_query
    await query.answer()
    parts = query.data.split(':')
    is_inline = parts[0] == 'inline_toggle_lang'
    new_lang = 'ru' if parts[1] == 'en' else 'en'
    search_query = ':'.join(parts[2:])
    
    # Обновляем оба параметра, чтобы кнопка сверху тоже переключилась
    save_user_data(query.from_user.id, 'share_lang', new_lang)
    save_user_data(query.from_user.id, 'lang', new_lang)
    
    await query.edit_message_text(text=format_message_with_links(search_query, search_query, lang=new_lang), reply_markup=create_keyboard(search_query, lang=new_lang, is_inline=is_inline), parse_mode="HTML", disable_web_page_preview=True)

async def handle_lang_set(update: Update, context: CallbackContext):
    query = update.callback_query
    await query.answer()
    new_lang = 'ru' if query.data.split(':')[1] == 'en' else 'en'
    save_user_data(query.from_user.id, 'lang', new_lang)
    save_user_data(query.from_user.id, 'share_lang', new_lang)
    kb = [[InlineKeyboardButton("Русский" if new_lang == 'en' else "English", callback_data=f"lang_set:{new_lang}")]]
    await query.edit_message_text(WELCOME_MESSAGES[new_lang], reply_markup=InlineKeyboardMarkup(kb), parse_mode="HTML")
    await set_menu_button(update, new_lang)

async def handle_message(update: Update, context: CallbackContext):
    if not update.message or not update.message.text: return
    text = update.message.text.strip()
    lang = get_user_share_lang(update.effective_user.id)
    converted = uniCoder(text)
    await update.message.reply_text(format_message_with_links(converted, converted, lang=lang), reply_markup=create_keyboard(converted, lang=lang), parse_mode="HTML", disable_web_page_preview=True)

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(handle_lang_set, pattern="^lang_set:"))
    app.add_handler(InlineQueryHandler(inline_query))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_handler(CallbackQueryHandler(toggle_language, pattern=r"^(inline_)?toggle_lang:"))
    app.run_polling()

if __name__ == "__main__":
    main()

