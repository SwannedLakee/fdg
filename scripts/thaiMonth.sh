#!/bin/bash

# Список месяцев
months_th=(มกราคม กุมภาพันธ์ มีนาคม เมษายน พฤษภาคม มิถุนายน กรกฎาคม สิงหาคม กันยายน ตุลาคม พฤศจิกายน ธันวาคม)
months_en=(January February March April May June July August September October November December)

# Индексы от 1 до 12
indices=($(seq 1 12))

# Перемешиваем индексы
shuffled_indices=($(shuf -e "${indices[@]}"))

# Строки вывода
thai_line=""
num_line=""
eng_line=""

for i in "${shuffled_indices[@]}"; do
  thai_line+="${months_th[$((i - 1))]} "
  num_line+="$i "
  eng_line+="${months_en[$((i - 1))]} "
done

# Вывод
echo "$thai_line"
read x
echo "$num_line"
echo "$eng_line"
