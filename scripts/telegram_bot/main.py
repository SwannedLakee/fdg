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
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    InlineQueryResultsButton
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

# === Сообщения ===
WELCOME_MESSAGES = {
    "en": (
        "✨ Welcome to Dhamma Gift Bot!\n\n"
        "❓ <b>How to use:</b>\n\n"
        "💬 <b>Call me in any chat or group:</b>\n"
        "⌨️ Type @dgift_bot or @dhammagift_bot and start typing a word to search or sutta reference (e.g. <code>sn12.2</code>)\n\n"
        "💡 Suggestions will appear for Pali words and sutta references\n\n"
        "🤓 You can use Velthuis transliteration for diacritics: <code>.t .d .n ~n aa ii uu</code> → <code>ṭ ḍ ṇ ñ ā ī ū</code>\n\n"
        "💬 <b>In this private chat:</b>\n"
        "Simply send me a word or reference (e.g. <code>saariputta</code> or <code>mn10</code>)\n\n\n"
        "Following commands available:\n"
        "/start - this message\n"
        "/extra - Mini App links\n"
        "/help - Dhamma.gift help will be here\n\n"
        "Change Bots language 👇 Изменить язык \n"
    ),
    "ru": (
        "Добро пожаловать в Dhamma Gift Bot!\n\n"
        "🔍 <b>Как использовать:</b>\n\n"
        "💬 <b>Вы можете вызвать меня в любом чате или группе:</b>\n"
        "⌨️ Напишите @dgift_bot или @dhammagift_bot и начните печатать слово или номер сутты (например, <code>sn12.2</code>)\n"
        "💡 Я предложу варианты палийских слов и ссылок на сутты\n\n"
        "🤓 Также Вы можете использовать транслитерацию Velthuis для диакритики: <code>.t .d .n ~n aa ii uu</code> → <code>ṭ ḍ ṇ ñ ā ī ū</code>\n\n"
        "💬 <b>В этом личном чате:</b>\n"
        "Просто отправьте мне слово или номер сутты (например, <code>saariputta</code> или <code>mn10</code>)\n\n\n"
        "Доступны следующие команды:\n"
        "/start - это сообщение\n"
        "/extra - ссылки на Mini Apps\n"
        "/help - здесь будет документация Dhamma.gift\n\n"
        "Изменить язык Бота 👇 Change Language\n"
    )
}

EXTRA_MESSAGES = {
    "ru": (
        "Мини Приложения на Русском. Вы можете закрепить это сообщение для быстрого доступа:\n\n"
        "🔎 Поиск\n"
        "http://t.me/dgift_bot/find\n"
        "📖 Чтение\n"
        "http://t.me/dgift_bot/read\n"
        "🌐 Словарь\n"
        "http://t.me/dgift_bot/dict\n\n"
    ),
    "en": (
        "Mini Applications in English. You may want to pin this message for quick access:\n\n"
        "🔎 Search\n"
        "http://t.me/dhammagift_bot/find\n"
        "📖 Read\n"
        "http://t.me/dhammagift_bot/read\n"
        "🌐 Dictionary\n"
        "http://t.me/dhammagift_bot/dict\n\n"
    )
}

# === Загрузка конфига ===
config_path = sys.argv[1] if len(sys.argv) > 1 else "config.json"
with open(config_path, "r") as f:
    config = json.load(f)

bot_name = config.get("NAME", "default_bot")
TOKEN = config.get("TOKEN", "")

# === Логирование ===
class TelegramTokenFilter(logging.Formatter):
    @staticmethod
    def _mask_token(text: str) -> str:
        return re.sub(r'(https?://api\.telegram\.org)/bot[^/]+/', r'\1/botTOKEN/', text, flags=re.IGNORECASE)

    def format(self, record):
        original = super().format(record)
        return self._mask_token(original)

file_handler = logging.FileHandler(f"{bot_name}.log")
stream_handler = logging.StreamHandler()
formatter = TelegramTokenFilter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)
stream_handler.setFormatter(formatter)

logging.basicConfig(level=logging.INFO, handlers=[file_handler, stream_handler])
logger = logging.getLogger(__name__)

# === Хранилище ===
USER_DATA_FILE = f"user_data_{bot_name}.json"
DEFAULT_LANG = "en"

def load_user_data() -> dict:
    if not os.path.exists(USER_DATA_FILE): return {}
    try:
        with open(USER_DATA_FILE, "r", encoding="utf-8") as f: return json.load(f)
    except Exception as e:
        logger.error(f"Error loading user_data: {e}")
        return {}

def save_user_data(user_id: int, key: str, value: str):
    try:
        data = load_user_data()
        user_id_str = str(user_id)
        if user_id_str not in data: data[user_id_str] = {}
        data[user_id_str][key] = value
        with open(USER_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e: logger.error(f"Error saving user_data: {e}")

def get_user_lang(user_id: int) -> str:
    return load_user_data().get(str(user_id), {}).get("lang", DEFAULT_LANG)

def get_user_share_lang(user_id: int) -> str:
    data = load_user_data()
    return data.get(str(user_id), {}).get("share_lang", get_user_lang(user_id) or DEFAULT_LANG)

# === Обработка текста ===
def uniCoder(text):
    if not text: return text
    replacements = [("aa", "ā"), ("ii", "ī"), ("uu", "ū"), ('"n', "ṅ"), ("~n", "ñ"), (".t", "ṭ"), (".d", "ḍ"), (".n", "ṇ"), (".m", "ṃ"), (".l", "ḷ"), (".h", "ḥ")]
    for pattern, repl in replacements: text = text.replace(pattern, repl)
    return text

def normalize(text: str) -> str:
    if not text: return text
    if not hasattr(normalize, "cache"): normalize.cache = {}
    if text in normalize.cache: return normalize.cache[text]
    
    text_lower = text.lower()
    replacements = [("aa", "a"), ("ii", "i"), ("uu", "u"), ('"n', "n"), ("~n", "n"), (".t", "t"), (".d", "d"), (".n", "n"), (".m", "m"), (".l", "l"), (".h", "h")]
    for pattern, repl in replacements: text_lower = text_lower.replace(pattern, repl)
    
    result = (text_lower.replace("ṁ", "m").replace("ṃ", "m").replace("ṭ", "t").replace("ḍ", "d").replace("ṇ", "n").replace("ṅ", "n").replace("ñ", "n").replace("ā", "a").replace("ī", "i").replace("ū", "u").replace(".", " "))
    normalize.cache[text] = result
    return result

def get_link_query(text: str) -> str:
    """
    Логика сокращения ссылки:
    Если в первом блоке есть цифра или это исключение (bu-pm и т.д.) 
    и слов больше одного -> берем только первый блок.
    """
    if not text: return text
    parts = text.split()
    if len(parts) <= 1: return text
    
    first_block = parts[0]
    exceptions = {"bu-pm", "bi-pm", "pm", "bupm", "bipm"}
    
    has_digit = any(char.isdigit() for char in first_block)
    is_exception = first_block.lower() in exceptions
    
    if has_digit or is_exception:
        return first_block
    return text

def autocomplete(prefix: str, max_results: int = 29) -> list[str]:
    try:
        if not hasattr(autocomplete, "word_data"): autocomplete.word_data = load_words()
        normalized_dict = autocomplete.word_data.get("normalized_dict", {})
        prefix_n = normalize(prefix)
        starts_with = [w for n, words in normalized_dict.items() if n.startswith(prefix_n) for w in words]
        contains = [w for n, words in normalized_dict.items() if prefix_n in n and not n.startswith(prefix_n) for w in words]
        suggestions = (sorted(list(set(starts_with)), key=lambda x: normalize(x)) + sorted(list(set(contains)), key=lambda x: normalize(x)))[:max_results]
        return suggestions
    except Exception as e:
        logger.error(f"Autocomplete error: {e}")
        return []

def load_words():
    try:
        path = os.path.join("assets", "sutta_words.txt")
        if not os.path.exists(path): return {"original_words": [], "normalized_dict": {}}
        with open(path, "r", encoding="utf-8") as f:
            words = [line.strip() for line in f if line.strip()]
            normalized_dict = {}
            for word in words:
                norm = normalize(word)
                normalized_dict.setdefault(norm, []).append(word)
            return {"original_words": words, "normalized_dict": normalized_dict}
    except Exception as e:
        logger.error(f"Dict load error: {e}")
        return {"original_words": [], "normalized_dict": {}}

# === Клавиатуры и Форматирование ===
def create_keyboard(original_query: str, lang: str = "en", is_inline: bool = False) -> InlineKeyboardMarkup:
    link_q = get_link_query(original_query)
    path = "ru/" if lang == "ru" else ""
    encoded_q = urllib.parse.quote_plus(link_q)
    
    search_url = f"https://f.dhamma.gift/{path}?p=-kn&q={encoded_q}"
    dict_url = f"https://dict.dhamma.gift/{path}search_html?q={encoded_q}"

    label_dict = "📘 Словарь" if lang == "ru" else "📘 Dictionary"
    label_site = f"{'Читать на' if lang == 'ru' else 'Read at'} 🔎 Dhamma.gift {'Ru' if lang == 'ru' else 'En'}"
    toggle_label = "Язык Ru/En" if lang == "ru" else "Lang En/Ru"

    callback_prefix = "inline_" if is_inline else ""
    keyboard = [
        [
            # Сохраняем original_query в callback, чтобы при смене языка не терялось название сутты
            InlineKeyboardButton(text=toggle_label, callback_data=f"{callback_prefix}toggle_lang:{lang}:{original_query}"),
            InlineKeyboardButton(text=label_dict, url=dict_url),
        ],
        [InlineKeyboardButton(text=label_site, url=search_url)]
    ]
    return InlineKeyboardMarkup(keyboard)

def format_message_with_links(display_text: str, link_query: str, lang: str = "en") -> str:
    path = "ru/" if lang == "ru" else ""
    encoded_q = urllib.parse.quote_plus(link_query)
    search_url = f"https://f.dhamma.gift/{path}?p=-kn&q={encoded_q}"
    dict_url = f"https://dict.dhamma.gift/{path}search_html?q={encoded_q}"
    label_dict = "📘 Словарь" if lang == "ru" else "📘 Dictionary"
    return f"\n{display_text}\n\n🔎 <a href='{search_url}'>Dhamma.gift</a> | <a href='{dict_url}'>{label_dict}</a>"

# === Обработчики ===
async def set_menu_button(update: Update, lang: str):
    user_id = update.effective_user.id
    button_text = "DG ru" if lang == "ru" else "DG en"
    button_url = f"https://f.dhamma.gift/{'ru/' if lang == 'ru' else ''}?source=pwa"
    try:
        await update.get_bot().set_chat_menu_button(chat_id=user_id, menu_button=MenuButtonWebApp(text=button_text, web_app=WebAppInfo(url=button_url)))
    except: pass

async def start(update: Update, context: CallbackContext):
    user_lang = get_user_lang(update.effective_user.id)
    keyboard = [[InlineKeyboardButton("Русский" if user_lang == 'en' else "English", callback_data=f"lang_set:{user_lang}")]]
    await update.message.reply_text(WELCOME_MESSAGES[user_lang], reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="HTML", disable_web_page_preview=True)
    await set_menu_button(update, user_lang)

async def handle_language_selection(update: Update, context: CallbackContext):
    query = update.callback_query
    await query.answer()
    new_lang = 'ru' if query.data.split(':')[1] == 'en' else 'en'
    save_user_data(query.from_user.id, 'lang', new_lang)
    save_user_data(query.from_user.id, 'share_lang', new_lang)
    keyboard = [[InlineKeyboardButton("Русский" if new_lang == 'en' else "English", callback_data=f"lang_set:{new_lang}")]]
    await query.edit_message_text(text=WELCOME_MESSAGES[new_lang], reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="HTML")
    await set_menu_button(update, new_lang)

async def extra_command(update: Update, context: CallbackContext):
    lang = get_user_lang(update.effective_user.id)
    keyboard = [[InlineKeyboardButton("English" if lang == "ru" else "Русский", callback_data=f"extra_toggle:{lang}")]]
    await update.message.reply_text(EXTRA_MESSAGES[lang], reply_markup=InlineKeyboardMarkup(keyboard), disable_web_page_preview=True)

async def handle_extra_toggle(update: Update, context: CallbackContext):
    query = update.callback_query
    await query.answer()
    new_lang = 'en' if query.data.split(':')[1] == 'ru' else 'ru'
    save_user_data(query.from_user.id, 'lang', new_lang)
    keyboard = [[InlineKeyboardButton("English" if new_lang == "ru" else "Русский", callback_data=f"extra_toggle:{new_lang}")]]
    await query.edit_message_text(text=EXTRA_MESSAGES[new_lang], reply_markup=InlineKeyboardMarkup(keyboard), disable_web_page_preview=True)

async def inline_query(update: Update, context: CallbackContext):
    query_text = update.inline_query.query.strip()
    user_id = update.inline_query.from_user.id
    interface_lang = get_user_lang(user_id)
    share_lang = get_user_share_lang(user_id)
    
    link_q = get_link_query(query_text)
    action_text = "Открыть Dhamma.gift Ru" if share_lang == "ru" else "Open Dhamma.gift En"
    btn_text = f"🔎 {action_text}: {link_q}" if query_text else f"🔎 {action_text}"
    path = "ru/" if share_lang == "ru" else ""
    final_url = f"https://f.dhamma.gift/{path}{'?p=-kn&q=' + urllib.parse.quote_plus(link_q) if query_text else ''}"
    
    hot_button = InlineQueryResultsButton(text=btn_text, web_app=WebAppInfo(url=final_url))
    results = []

    if query_text:
        suggestions = autocomplete(query_text)
        converted_display = uniCoder(query_text)
        
        # Главный результат (пользовательский ввод)
        results.append(InlineQueryResultArticle(
            id="user_input",
            title=f"✏️ Send: {converted_display}" if interface_lang == "en" else f"✏️ Отправить: {converted_display}",
            input_message_content=InputTextMessageContent(format_message_with_links(converted_display, link_q, lang=share_lang), parse_mode="HTML", disable_web_page_preview=True),
            reply_markup=create_keyboard(query_text, lang=share_lang, is_inline=True)
        ))
        
        # Подсказки слов
        for idx, word in enumerate(suggestions):
            results.append(InlineQueryResultArticle(
                id=f"dict_{idx}", title=word,
                input_message_content=InputTextMessageContent(format_message_with_links(word, word, lang=share_lang), parse_mode="HTML", disable_web_page_preview=True),
                reply_markup=create_keyboard(word, lang=share_lang, is_inline=True)
            ))
    
    await update.inline_query.answer(results, button=hot_button, cache_time=0, is_personal=True)

async def handle_message(update: Update, context: CallbackContext):
    if not update.message or not update.message.text: return
    text = update.message.text.strip()
    user_id = update.effective_user.id
    
    if update.message.via_bot and update.message.via_bot.username in ["dgift_bot", "dhammagift_bot"]: return
    if re.search(r'http[s]?://', text):
        await update.message.reply_text("Пожалуйста, пришлите текст без URL." if get_user_lang(user_id) == "ru" else "Please send text without URLs.")
        return

    share_lang = get_user_share_lang(user_id)
    display_text = uniCoder(text)
    link_q = get_link_query(text)
    
    await update.message.reply_text(
        format_message_with_links(display_text, link_q, lang=share_lang), 
        reply_markup=create_keyboard(text, lang=share_lang), 
        parse_mode="HTML", 
        disable_web_page_preview=True
    )

async def toggle_language(update: Update, context: CallbackContext):
    query = update.callback_query
    await query.answer()
    parts = query.data.split(':')
    is_inline = parts[0] == 'inline_toggle_lang'
    new_lang = 'ru' if parts[1] == 'en' else 'en'
    original_text = ':'.join(parts[2:])
    
    save_user_data(query.from_user.id, 'share_lang', new_lang)
    save_user_data(query.from_user.id, 'lang', new_lang)
    
    display_text = uniCoder(original_text)
    link_q = get_link_query(original_text)
    
    await query.edit_message_text(
        text=format_message_with_links(display_text, link_q, lang=new_lang), 
        reply_markup=create_keyboard(original_text, lang=new_lang, is_inline=is_inline), 
        parse_mode="HTML", 
        disable_web_page_preview=True
    )

def main():
    os.makedirs("assets", exist_ok=True)
    app = Application.builder().token(TOKEN).build()
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("extra", extra_command))
    app.add_handler(CallbackQueryHandler(handle_language_selection, pattern="^lang_set:"))
    app.add_handler(CallbackQueryHandler(handle_extra_toggle, pattern=r"^extra_toggle:"))
    app.add_handler(CallbackQueryHandler(toggle_language, pattern=r"^(inline_)?toggle_lang:"))
    app.add_handler(InlineQueryHandler(inline_query))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    app.run_polling()

if __name__ == "__main__":
    main()

