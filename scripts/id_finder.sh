#!/bin/bash
search_and_link() {
  local input="$1"
  if [[ -z "$input" ]]; then
    return
  fi

  # grep + awk
  echo
grep -m1 -r --color=always "$input" ../suttacentral.net/sc-data/sc_bilara_data/root/pli/ms/ assets/texts/sutta ../suttacentral.net/sc-data/sc_bilara_data/translation/en/ 2>/dev/null | \
  awk -F':' '{for(i=2; i<=NF; i++) printf "%s%s", $i, (i==NF ? "\n" : ":")}' | \
  GREP_COLORS='mt=38;5;208' grep -E --color=always "|счаст|радос|приятн|sukh|sug|hit"


  local prefix="${input%%:*}"
  local suffix="${input#*:}"
  echo
  echo "https://dhamma.gift/r/?q=${prefix}#${suffix}"
    echo "https://f.dhamma.gift/r/?q=${prefix}#${suffix}"
  echo "http://localhost/r/?q=${prefix}#${suffix}"
  echo "http://127.0.0.1:8080/r/?q=${prefix}#${suffix}"echo
  echo 
  echo 
}

if [ $# -gt 0 ]; then
  search_and_link "$1"
  exit 0
fi

echo "Enter strings (e.g. an1.30:1.1), Ctrl+D to exit."
while IFS= read -r input; do
  search_and_link "$input"
done
