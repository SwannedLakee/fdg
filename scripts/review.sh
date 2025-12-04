cd assets/texts/ru/
mkdir -p translations-o && find . -type f -name "*-ru-o*.json" -exec cp -v {} translations-o/ \;
cd translations-o/
for f in *.json; do echo -e "\n=== ФАЙЛ: $f ==="; cat "$f"; done > review.txt
rm *.json



