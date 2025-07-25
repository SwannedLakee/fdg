#!/bin/bash

paths=(
  "../suttacentral.net/sc-data/sc_bilara_data/root/pli/ms/"
  "assets/texts/sutta"
  "../suttacentral.net/sc-data/sc_bilara_data/translation/en/"
)

echo "Enter strings (e.g. an1.30:1.1), Ctrl+D to exit."

while IFS= read -r input; do
  if [[ -z "$input" ]]; then
    continue
  fi

  # Ищем и выводим результат grep + awk (без ошибок)
  grep -m1 -r --color=always "$input" "${paths[@]}" 2>/dev/null | \
    awk -F':' '{for(i=2; i<=NF; i++) printf "%s%s", $i, (i==NF ? "\n" : ":")}'

  prefix="${input%%:*}"
  suffix="${input#*:}"
  echo "https://dhamma.gift/r/?q=${prefix}#${suffix}"
echo 
echo 
echo
done
