#!/data/data/com.termux/files/usr/bin/bash

# ===== ОБЩИЕ ПЕРЕМЕННЫЕ =====

BASE_URL="https://f.dhamma.gift/memorize/?rp=true&q="
BASE_AUDIO="/storage/emulated/0/Download/Sutta Audio"

# ===== НАБОР =====

SET="DN22#13.0.2"
SET="an4.199#3.2"
#SET="an5.55#3.3"
# SET="MN9#14.4"

AUDIO_FILE="dn22-4-1.mp3"
AUDIO_FILE="an5.55.mp3"
AUDIO_FILE="an4.199.mp3"
# AUDIO_FILE="dn22-4-2.mp3"
# AUDIO_FILE="mn91.mp3"

# ===== СБОРКА =====

set_lc="${SET,,}"
URL="${BASE_URL}${set_lc}"
AUDIO="${BASE_AUDIO}/${AUDIO_FILE}"

# ===== ОПРЕДЕЛЕНИЕ ДЛИНЫ =====

AUDIO_LEN=0
AUDIO_MSG="длина файла неизвестна"

if command -v ffprobe >/dev/null 2>&1; then
  AUDIO_LEN=$(ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$AUDIO")
  AUDIO_LEN=$(printf "%.0f" "$AUDIO_LEN")
  AUDIO_MSG="файл ${AUDIO_FILE} длина ${AUDIO_LEN} сек"
fi

# ===== ВВОД ИНТЕРВАЛА =====

echo "$AUDIO_MSG"
read -p "Введите интервал (сек): " INTERVAL

SLEEP_TIME=$((INTERVAL + AUDIO_LEN))

# ===== ЗАПУСК =====

n=1
termux-open-url "$URL"

while true; do
  echo "Запуск #$n"
  termux-open "$AUDIO"
  sleep "$SLEEP_TIME"
  ((n++))
done
