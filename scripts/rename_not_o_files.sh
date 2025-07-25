#!/bin/bash

echo "Вставьте список 'modified: ...'. Когда закончите — нажмите Ctrl+D:"

while read -r line; do
  filepath=$(echo "$line" | sed 's/^modified:[[:space:]]*//')

  [[ "$filepath" != *.json ]] && continue

  if [[ "$filepath" =~ [+-]o\.json$ ]]; then
    continue
  fi

  dir=$(dirname "$filepath")
  base=$(basename "$filepath" .json)
  target="$dir/${base}+edited+o.json"

  if [[ -f "$target" ]]; then
    echo "Skip: already exists → $target"
    continue
  fi

  if [[ -f "$filepath" ]]; then
    echo "Renaming:"
    echo "  $filepath"
    echo "    → $target"
    mv "$filepath" "$target"
  else
    echo "Skip: source file missing → $filepath"
  fi
done

echo
echo "✅ Обработка завершена. Нажмите Enter для выхода или Ctrl+C."
