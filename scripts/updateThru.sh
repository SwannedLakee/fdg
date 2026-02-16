#!/bin/bash

# 1. Подготовка и переход в папку
mkdir -p theravada.ru
# Если запускаете скрипт не из корня, где лежит папка theravada.ru, раскомментируйте cd:
# cd theravada.ru || exit

# Если нужно скачать заново, раскомментируй:
# wget -r --no-check-certificate -P ./ --no-parent https://theravada.ru/Teaching/canon.htm

#

# Переходим к текстам (Важно: скрипт предполагает, что мы внутри структуры папок)
cd theravada.ru/Teaching/Canon/ || exit

echo "--- Этап 1: Конвертация кодировки (Windows-1251 -> UTF-8) ---"

find . -name "*.htm" -type f | sort -V | while read -r i; do
    echo $i
    iconv -f windows-1251 -t utf-8 "$i" > "${i}.tmp" 2>/dev/null
    if [ $? -eq 0 ]; then
        mv -f "${i}.tmp" "$i"
        sed -i 's@windows-1251@utf-8@g' "$i"
    else
        rm -f "${i}.tmp"
    fi
done

echo "--- Этап 2: Внедрение ссылок, CSS и JS ---"

# Ищем файлы с текстами сутт
grep -lri "&#1645;</span>" . | sort -V | while read -r i; do
    
    # Вычисляем slug
    textindex=$(echo "$i" | awk -F'/' '{print $NF}' | awk -F'-' '{print $1}' | sed 's/.htm.*//g' | sed 's@_@.@g' | sed 's@dhm@dhp@g' | sed 's@\.volovsky@@g' | sed 's@\.sv@@g')

    # Формируем правильную ссылку на оригинал
    clean_path="${i#./}"
    real_url="https://theravada.ru/Teaching/Canon/$clean_path"

    echo "Processing: ($textindex) $i"

    # --- КОМАНДА 1: Ссылки (DG, SC, Th.ru) и Кнопка Voice ---
sed -i \
  '/&#1645;<\/span>/s|<\/span>|</span> <span class="ext-links">\
<a href="/ru/?q='"$textindex"'">DG</a> \
<a href="javascript:void(0)" class="voice-link" data-slug="'"$textindex"'" title="Слушать">Voice 🔊</a> \
<a href="https://suttacentral.net/'"$textindex"'">SC</a> \
<a href="'"$real_url"'">Th.ru</a></span>|' \
  "$i"
  
    # --- КОМАНДА 2: Подключение JS перед </body> ---
    if ! grep -q "voice.js" "$i"; then
        sed -i 's|</body>|<script src="/read/js/voice.js"></script></body>|' "$i"
    fi

    # --- КОМАНДА 3: Подключение CSS перед </head> ---
    if ! grep -q "uiextra.css" "$i"; then
        sed -i 's|</head>|<link rel="stylesheet" href="/read/css/uiextra.css"></head>|' "$i"
    fi

    # --- КОМАНДА 4: Правка ширины таблицы (1000 -> 100%) ---
    # Меняем жесткую ширину 1000px на 100%, чтобы влезало в мобильный
    sed -i 's/table width="1000"/table width="100%" style="max-width: 1000px;"/g' "$i"
    
    sed -i 's/width="36%">/width="86%">/g' "$i"

    # --- КОМАНДА 5: Правка логики шрифтов в старом скрипте ---
    # Меняем "size", "8" на "size", "5"
    sed -i 's/setAttribute("size", "5")/setAttribute("size", "4")/g' "$i"
    # Меняем "size", "6" на "size", "4"
    sed -i 's/setAttribute("size", "6")/setAttribute("size", "3")/g' "$i"

done

echo "--- Готово! Ссылки исправлены, скрипты подключены. ---"


exit 0


добавмть в ui3xta css

.ext-links {
  font-size: 0.85em;      /* общий размер */
  white-space: nowrap;   /* чтобы не ломалось в переносах */
}

.ext-links a {
  margin-left: 0.3em;
}



#wget

wget -r -np -nH --no-check-certificate \
  --domains=theravada.ru \
  --accept-regex '/Teaching/Canon/' \
  -P ./ \
  https://theravada.ru/Teaching/canon.htm