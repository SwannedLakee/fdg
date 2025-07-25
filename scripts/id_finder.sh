#!/bin/bash

if [ $# -eq 0 ]; then
  read -p "Enter string (e.g. an1.30:1.1): " input
else
  input="$1"
fi

paths=(
  "../suttacentral.net/sc-data/sc_bilara_data/root/pli/ms/"
  "assets/texts/sutta"
  "../suttacentral.net/sc-data/sc_bilara_data/translation/en/"
)

# Ищем и собираем результат в одну строку, убираем ошибки
result=$(grep -m1 -r --color=always "$input" "${paths[@]}" 2>/dev/null | tr '\n' ' ')

echo "$result"

prefix="${input%%:*}"
suffix="${input#*:}"
echo "https://dhamma.gift/r/?q=${prefix}#${suffix}"
