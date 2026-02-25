#!/data/data/com.termux/files/usr/bin/bash

# ===== ВВОД ИНТЕРВАЛА =====

read -p "Введите урл (сек): " URL
read -p "Введите интервал (сек): " INTERVAL
SLEEP_TIME=$((INTERVAL + AUDIO_LEN))

# ===== ЗАПУСК =====

n=1
while true; do
termux-open "$URL"
  echo "Запуск #$n"
  sleep "$SLEEP_TIME"
  ((n++))
done
