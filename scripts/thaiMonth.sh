
#!/bin/bash

# Список месяцев
months=(มกราคม กุมภาพันธ์ มีนาคม เมษายน พฤษภาคม มิถุนายน กรกฎาคม สิงหาคม กันยายน ตุลาคม พฤศจิกายน ธันวาคม)

# Индексы от 1 до 12
indices=($(seq 1 12))

# Перемешиваем индексы
shuffled_indices=($(shuf -e "${indices[@]}"))

# Строки вывода
thai_line=""
num_line=""

for i in "${shuffled_indices[@]}"; do
  thai_line+="${months[$((i - 1))]} "
  num_line+="$i "
done

# Вывод
echo "$thai_line"
read x
echo "$num_line"
