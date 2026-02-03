#!/data/data/com.termux/files/usr/bin/bash

# ===== ОБЩИЕ ПЕРЕМЕННЫЕ =====

BASE_URL="https://f.dhamma.gift/memorize/?rp=true&q="
BASE_AUDIO="/storage/emulated/0/Download/Sutta Audio"

# ===== НАБОР (ВРУЧНУЮ) =====

SET="Mn9#14.4"
SET="DN22#13.0.2"

AUDIO_FILE="mn91.mp3"
AUDIO_FILE="dn22-4-1.mp3"
# AUDIO_FILE="dn22-4-2.mp3"

# ===== НОРМАЛИЗАЦИЯ =====

set_lc="${SET,,}"

# ===== СБОРКА =====

URL="${BASE_URL}${set_lc}"
AUDIO="${BASE_AUDIO}/${AUDIO_FILE}"

# ===== ЗАПУСК =====

read -p "Интервал в секундах: " x

n=1
termux-open-url "$URL"

while true; do
  echo "$n"
  termux-open "$AUDIO"
  ((n++))
  sleep "$x"
done
