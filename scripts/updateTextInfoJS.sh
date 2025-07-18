#!/bin/bash

# Файл, от которого сравниваем время изменения
REFERENCE_FILE="assets/texts/lastupdate_stateTextInfo_file"

# Проверяем, существует ли он
if [ ! -f "$REFERENCE_FILE" ]; then
newer=""
else
#echo "newer case"
newer="-newer $REFERENCE_FILE"
fi


# Полная команда для создания массива
mapfile -t keys_to_modify < <(
  find assets/texts/sutta/ -name "*.json" $newer \
    | grep -iE "(ru-o.json|experiment|progres)" \
    | awk -F'/' '{print $NF}' \
    | awk -F'_' '{print $1}' \
    | sort -V
)
 
input_file="assets/js/textinfo.js"
backup_file="assets/js/textinfoBak.js"
output_file="/tmp/textinfo.js" # Файл с результатом



# Создаем временный файл с ключами в формате JSON
keys_json="/tmp/keys.json"
printf '%s\n' "${keys_to_modify[@]}" | jq -R . | jq -s . > "$keys_json"

jq -c --slurpfile keys "$keys_json" '
  with_entries(
    if .key as $k | ($keys[0] | index($k)) and (.value | has("ru")) and (.value.ru | contains(" (o)") | not)
    then .value.ru |= . + " (o)"
    else .
    end
  )
' "$input_file" > "$output_file"

sed -i 's/},/},\n/g' "$output_file"

 if [[ $? != 0 ]]; then
    echo "</br>error in $i"
    error_found=1  # Устанавливаем флаг ошибки
  fi



# Если не было ошибок, создаем/обновляем state_file
if [[ $error_found -eq 0 ]]; then
  touch $REFERENCE_FILE
fi

if ! cmp -s "$output_file" "$input_file"; then
    cp "$input_file" "$backup_file"
    mv "$output_file" "$input_file"
fi

# Проверяем, не пуст ли массив
if [ "${#keys_to_modify[@]}" -gt 0 ]; then
  echo "new texts added to textinfo.js [ ${#keys_to_modify[@]} ]"

fi

rm "$keys_json"

#echo "Обработка завершена. Результат сохранен в $output_file"

exit 0 

# Полная команда для создания массива
mapfile -t keys_array < <(
  find assets/texts/sutta/ -name "*.json" \
    | grep -iE "(ru-o.json|experiment|progres)" \
    | awk -F'/' '{print $NF}' \
    | awk -F'_' '{print $1}' \
    | sort -V
)

# Вывод в формате Bash массива
#declare -p keys_array

# ИЛИ вывод в формате JavaScript массива
printf "[\n"
printf "  \"%s\"\n" "${keys_array[@]}"
printf "]\n"


exit 0



# Список ключей для модификации
keys_to_modify=(
  "an3.76"
  "an3.77"
  "an3.80"
  "an3.107"
  "an4.10"
  "an4.106"
  "an4.160"
  "an4.274"
  "an4.275"
  "an4.277-303"
  "an4.304-783"
  "an5.43"
  "an5.303"
  "an5.304"
  "an5.305"
  "an5.306"
  "an5.307"
  "an5.308-1152"
  "an6.23"
  "an6.63"
  "an6.140"
  "an6.141"
  "an6.142"
  "an6.143-169"
  "an6.170-649"
  "an7.17"
  "an7.18"
  "an7.615"
  "an7.616"
  "an7.617"
  "an7.618-644"
  "an7.645-1124"
  "an8.56"
  "an8.118"
  "an8.119"
  "an8.120"
  "an8.121-147"
  "an8.148-627"
  "an9.30"
  "an9.32"
  "an9.60"
  "an9.93"
  "an9.94"
  "an9.95-112"
  "an9.113-432"
  "an10.46"
  "an10.113"
  "an10.132"
  "an10.133"
  "an10.134"
  "an10.135"
  "an10.136"
  "an10.137"
  "an10.138"
  "an10.139"
  "an10.140"
  "an10.141"
  "an10.142"
  "an10.143"
  "an10.144"
  "an10.145"
  "an10.146"
  "an10.147"
  "an10.148"
  "an10.149"
  "an10.150"
  "an10.151"
  "an10.152"
  "an10.153"
  "an10.154"
  "an10.171"
  "an10.179"
  "an10.180"
  "an10.181"
  "an10.182"
  "an10.183"
  "an10.184"
  "an10.185"
  "an10.186"
  "an10.187"
  "an10.188"
  "an10.189"
  "an10.190"
  "an10.191"
  "an10.192"
  "an10.193"
  "an10.194"
  "an10.195"
  "an10.196"
  "an10.197"
  "an10.198"
  "an10.199-210"
  "an10.237"
  "an10.238"
  "an10.239"
  "an10.240-266"
  "an10.267-746"
  "dn22"
  "mn141"
  "sn1.58"
  "sn12.2"
  "sn12.5"
  "sn12.6"
  "sn12.7"
  "sn12.8"
  "sn12.9"
  "sn12.82"
  "sn12.83-92"
  "sn12.93-213"
  "sn14.35"
  "sn18.3"
  "sn19.1"
  "sn19.2"
  "sn19.3"
  "sn19.4"
  "sn19.5"
  "sn19.6"
  "sn19.7"
  "sn19.8"
  "sn19.9"
  "sn19.10"
  "sn19.11"
  "sn19.12"
  "sn19.13"
  "sn19.14"
  "sn19.15"
  "sn19.16"
  "sn19.17"
  "sn19.18"
  "sn19.19"
  "sn19.20"
  "sn19.21"
  "sn22.16"
  "sn22.17"
  "sn22.29"
  "sn22.33"
  "sn22.49"
  "sn22.56"
  "sn22.59"
  "sn22.79"
  "sn22.87"
  "sn22.102"
  "sn22.104"
  "sn23.1"
  "sn23.13"
  "sn23.14"
  "sn23.15"
  "sn23.16"
  "sn23.17"
  "sn23.18"
  "sn23.20"
  "sn35.19"
  "sn35.20"
  "sn35.28"
  "sn35.65"
  "sn35.66"
  "sn35.67"
  "sn35.68"
  "sn35.77"
  "sn35.78"
  "sn35.79"
  "sn35.80"
  "sn35.81"
  "sn35.82"
  "sn35.86"
  "sn35.89"
  "sn35.92"
  "sn35.99"
  "sn35.100"
  "sn35.101"
  "sn35.102"
  "sn35.109"
  "sn35.110"
  "sn35.122"
  "sn35.123"
  "sn35.125"
  "sn35.126"
  "sn35.128"
  "sn35.138"
  "sn35.139"
  "sn35.152"
  "sn35.156"
  "sn35.157"
  "sn35.158"
  "sn35.159"
  "sn35.160"
  "sn35.161"
  "sn35.168"
  "sn35.169"
  "sn35.170"
  "sn35.171-173"
  "sn35.174-176"
  "sn35.177-179"
  "sn35.180-182"
  "sn35.183-185"
  "sn35.186"
  "sn35.187"
  "sn35.188"
  "sn35.189-191"
  "sn35.192-194"
  "sn35.195-197"
  "sn35.198-200"
  "sn35.201-203"
  "sn35.204"
  "sn35.205"
  "sn35.206"
  "sn35.207-209"
  "sn35.210-212"
  "sn35.213-215"
  "sn35.216-218"
  "sn35.219-221"
  "sn35.222"
  "sn35.223"
  "sn35.224"
  "sn35.225"
  "sn35.226"
  "sn35.227"
  "sn35.228"
  "sn35.229"
  "sn35.236"
  "sn35.237"
  "sn35.238"
  "sn36.5"
  "sn36.24"
  "sn36.25"
  "sn36.26"
  "sn36.27"
  "sn36.28"
  "sn36.29"
  "sn36.30"
  "sn36.31"
  "sn37.1"
  "sn37.2"
  "sn37.3"
  "sn38.4"
  "sn38.9"
  "sn38.10"
  "sn38.11"
  "sn38.12"
  "sn38.14"
  "sn45.1"
  "sn45.21"
  "sn45.22"
  "sn45.23"
  "sn45.24"
  "sn45.25"
  "sn45.26"
  "sn45.28"
  "sn45.31"
  "sn45.32"
  "sn45.35"
  "sn45.36"
  "sn45.37"
  "sn45.38"
  "sn45.162"
  "sn45.163"
  "sn45.164"
  "sn45.165"
  "sn45.166"
  "sn45.167"
  "sn45.168"
  "sn45.169"
  "sn45.170"
  "sn45.171"
  "sn45.172"
  "sn45.173"
  "sn45.174"
  "sn45.175"
  "sn45.176"
  "sn45.177"
  "sn45.178"
  "sn45.179"
  "sn45.180"
  "sn46.34"
  "sn46.42"
  "sn46.43"
  "sn46.58"
  "sn46.59"
  "sn46.60"
  "sn46.61"
  "sn46.62"
  "sn46.63"
  "sn46.64"
  "sn46.65"
  "sn46.66"
  "sn46.67"
  "sn46.68"
  "sn46.69"
  "sn46.70"
  "sn46.71"
  "sn46.72"
  "sn46.73"
  "sn46.74"
  "sn46.75"
  "sn46.77-88"
  "sn46.89-98"
  "sn46.99-110"
  "sn46.111-120"
  "sn46.121-129"
  "sn46.131-142"
  "sn46.143-152"
  "sn46.153-164"
  "sn46.165-174"
  "sn46.175-184"
  "sn47.42"
  "sn47.63-72"
  "sn47.73-84"
  "sn47.85-94"
  "sn47.95-104"
  "sn48.1"
  "sn48.2"
  "sn48.3"
  "sn48.4"
  "sn48.5"
  "sn48.6"
  "sn48.7"
  "sn48.8"
  "sn48.9"
  "sn48.10"
  "sn48.12"
  "sn48.13"
  "sn48.14"
  "sn48.15"
  "sn48.16"
  "sn48.17"
  "sn48.18"
  "sn48.19"
  "sn48.20"
  "sn48.21"
  "sn48.22"
  "sn48.23"
  "sn48.24"
  "sn48.25"
  "sn48.26"
  "sn48.27"
  "sn48.28"
  "sn48.29"
  "sn48.30"
  "sn48.31"
  "sn48.32"
  "sn48.33"
  "sn48.34"
  "sn48.35"
  "sn48.36"
  "sn48.37"
  "sn48.38"
  "sn48.39"
  "sn48.44"
  "sn48.45"
  "sn48.46"
  "sn48.47"
  "sn48.48"
  "sn48.51"
  "sn48.52"
  "sn48.54"
  "sn48.55"
  "sn48.56"
  "sn48.59"
  "sn48.60"
  "sn48.61"
  "sn48.62"
  "sn48.63"
  "sn48.64"
  "sn48.65"
  "sn48.66"
  "sn48.67"
  "sn48.68"
  "sn48.69"
  "sn48.70"
  "sn48.71-82"
  "sn48.83-92"
  "sn48.93-104"
  "sn48.105-114"
  "sn48.115-124"
  "sn48.125-136"
  "sn48.137-146"
  "sn48.147-158"
  "sn48.159-168"
  "sn48.169-178"
  "sn50.45-54"
  "sn50.89-98"
  "sn50.99-108"
  "sn51.1"
  "sn51.24"
  "sn51.45-54"
  "sn51.55-66"
  "sn51.67-76"
  "sn51.77-86"
  "sn52.14"
  "sn52.15"
  "sn52.16"
  "sn52.17"
  "sn52.18"
  "sn52.19"
  "sn52.20"
  "sn52.21"
  "sn54.1"
  "sn54.3"
  "sn54.4"
  "sn54.5"
  "sn54.19"
  "sn55.55"
  "sn55.56"
  "sn55.57"
  "sn55.58"
  "sn55.59"
  "sn55.60"
  "sn55.61"
  "sn55.62"
  "sn55.63"
  "sn55.64"
  "sn55.65"
  "sn55.66"
  "sn55.67"
  "sn55.68"
  "sn55.69"
  "sn55.70"
  "sn55.71"
  "sn55.72"
  "sn55.73"
  "sn55.74"
  "sn56.1"
  "sn56.2"
  "sn56.3"
  "sn56.4"
  "sn56.5"
  "sn56.6"
  "sn56.7"
  "sn56.8"
  "sn56.9"
  "sn56.10"
  "sn56.11"
  "sn56.12"
  "sn56.13"
  "sn56.14"
  "sn56.15"
  "sn56.16"
  "sn56.17"
  "sn56.18"
  "sn56.19"
  "sn56.20"
  "sn56.21"
  "sn56.22"
  "sn56.23"
  "sn56.24"
  "sn56.25"
  "sn56.26"
  "sn56.27"
  "sn56.28"
  "sn56.29"
  "sn56.30"
  "sn56.31"
  "sn56.32"
  "sn56.33"
  "sn56.34"
  "sn56.35"
  "sn56.36"
  "sn56.37"
  "sn56.38"
  "sn56.39"
  "sn56.40"
  "sn56.41"
  "sn56.42"
  "sn56.43"
  "sn56.44"
  "sn56.45"
  "sn56.46"
  "sn56.47"
  "sn56.48"
  "sn56.49"
  "sn56.50"
  "sn56.51"
  "sn56.52"
  "sn56.53"
  "sn56.54"
  "sn56.55"
  "sn56.56"
  "sn56.57"
  "sn56.58"
  "sn56.59"
  "sn56.60"
  "sn56.61"
  "sn56.62"
  "sn56.63"
  "sn56.64"
  "sn56.65"
  "sn56.66"
  "sn56.67"
  "sn56.68"
  "sn56.69"
  "sn56.70"
  "sn56.71"
  "sn56.72"
  "sn56.73"
  "sn56.74"
  "sn56.75"
  "sn56.76"
  "sn56.77"
  "sn56.78"
  "sn56.79"
  "sn56.80"
  "sn56.81"
  "sn56.82"
  "sn56.83"
  "sn56.84"
  "sn56.85"
  "sn56.86"
  "sn56.87"
  "sn56.88"
  "sn56.89"
  "sn56.90"
  "sn56.91"
  "sn56.92"
  "sn56.93"
  "sn56.94"
  "sn56.95"
  "sn56.96-101"
  "sn56.102"
  "sn56.103"
  "sn56.104"
  "sn56.105-107"
  "sn56.108-110"
  "sn56.111-113"
  "sn56.114-116"
  "sn56.117-119"
  "sn56.120-122"
  "sn56.123-125"
  "sn56.126-128"
  "sn56.129-130"
  "sn56.131"
  "snp1.8"
  "thag4.12"
  "ud3.6"
)

