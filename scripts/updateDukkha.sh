cd /var/www/html/assets/texts/sutta

#asset
grep -riE "\bстрадан" * | grep -v ru-o.json > /var/www/html/all.txt
grep -riE "\bстрадан" * | grep -v ru-o.json | grep edited > /var/www/html/edited.txt


echo >> /var/www/html/scripts/updateDukkha.sh
date >> /var/www/html/scripts/updateDukkha.sh
wc -l /var/www/html/all.txt /var/www/html/edited.txt | grep -v total >> /var/www/html/scripts/updateDukkha.sh
tail /var/www/html/scripts/updateDukkha.sh
cd - 


exit 0

Wed Jul 23 01:58:52 AM +05 2025
  1090 /var/www/html/all.txt
   265 /var/www/html/edited.txt

Wed Jul 23 02:12:37 AM +05 2025
  1056 /var/www/html/all.txt
   251 /var/www/html/edited.txt

