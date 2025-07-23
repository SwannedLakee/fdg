#cd /var/www/html
#cd $prefix/assets/texts/sutta/
#asset


prefix=/media/c/soft/dg
prefix=/mnt/c/soft/dg

function commonGrep() {

grep -riE "\bстрадан" $prefix/assets/texts/sutta/* | grep -v "бедствии, несчастье, страдании, преисподней" | grep -v "страдан.*плач.*бол"
}

commonGrep > $prefix/all.txt
commonGrep | grep -v ru-o.json | grep edited > $prefix/edited.txt

echo >> $prefix/scripts/updateDukkha.sh
date >> $prefix/scripts/updateDukkha.sh
wc -l $prefix/all.txt $prefix/edited.txt | grep -v total >> $prefix/scripts/updateDukkha.sh
tail $prefix/scripts/updateDukkha.sh
#cd - 

exit 0

Wed Jul 23 01:58:52 AM +05 2025
  1090 /var/www/html/all.txt
   265 /var/www/html/edited.txt

Wed Jul 23 02:12:37 AM +05 2025
  1056 /var/www/html/all.txt
   251 /var/www/html/edited.txt

Tue Jul 22 18:33:20 EDT 2025
  1055 /mnt/c/soft/dg/all.txt
   250 /mnt/c/soft/dg/edited.txt

Tue Jul 22 18:40:22 EDT 2025
  1039 /mnt/c/soft/dg/all.txt
   239 /mnt/c/soft/dg/edited.txt

Tue Jul 22 18:52:23 EDT 2025
  1024 /mnt/c/soft/dg/all.txt
   230 /mnt/c/soft/dg/edited.txt

Tue Jul 22 18:57:34 EDT 2025
  1020 /mnt/c/soft/dg/all.txt
   226 /mnt/c/soft/dg/edited.txt

Tue Jul 22 19:17:48 EDT 2025
   978 /mnt/c/soft/dg/all.txt
   262 /mnt/c/soft/dg/edited.txt

Tue Jul 22 19:22:34 EDT 2025
   973 /mnt/c/soft/dg/all.txt
   262 /mnt/c/soft/dg/edited.txt

Tue Jul 22 19:28:28 EDT 2025
   916 /mnt/c/soft/dg/all.txt
   280 /mnt/c/soft/dg/edited.txt

Tue Jul 22 19:38:41 EDT 2025
   915 /mnt/c/soft/dg/all.txt
   279 /mnt/c/soft/dg/edited.txt

Tue Jul 22 19:43:29 EDT 2025
   883 /mnt/c/soft/dg/all.txt
   309 /mnt/c/soft/dg/edited.txt

Tue Jul 22 19:48:52 EDT 2025
   844 /mnt/c/soft/dg/all.txt
   293 /mnt/c/soft/dg/edited.txt

Tue Jul 22 19:59:21 EDT 2025
   836 /mnt/c/soft/dg/all.txt
   289 /mnt/c/soft/dg/edited.txt

Tue Jul 22 20:28:30 EDT 2025
   812 /mnt/c/soft/dg/all.txt
   267 /mnt/c/soft/dg/edited.txt

Tue Jul 22 20:30:07 EDT 2025
   811 /mnt/c/soft/dg/all.txt
   266 /mnt/c/soft/dg/edited.txt

Tue Jul 22 23:02:14 EDT 2025
   807 /mnt/c/soft/dg/all.txt
   262 /mnt/c/soft/dg/edited.txt


Tue Jul 22 23:13:37 EDT 2025
   783 /mnt/c/soft/dg/all.txt
   266 /mnt/c/soft/dg/edited.txt

Wed Jul 23 10:07:29 EDT 2025
   777 /mnt/c/soft/dg/all.txt
   319 /mnt/c/soft/dg/edited.txt

Wed Jul 23 10:16:29 EDT 2025
   774 /mnt/c/soft/dg/all.txt
   316 /mnt/c/soft/dg/edited.txt

Wed Jul 23 11:15:04 EDT 2025
   775 /mnt/c/soft/dg/all.txt
   317 /mnt/c/soft/dg/edited.txt

Wed Jul 23 11:37:00 EDT 2025
   766 /mnt/c/soft/dg/all.txt
   321 /mnt/c/soft/dg/edited.txt

Wed Jul 23 12:16:53 EDT 2025
   766 /mnt/c/soft/dg/all.txt
   541 /mnt/c/soft/dg/edited.txt

Wed Jul 23 12:18:14 EDT 2025
   807 /mnt/c/soft/dg/all.txt
   541 /mnt/c/soft/dg/edited.txt

Wed Jul 23 13:52:21 EDT 2025
   791 /mnt/c/soft/dg/all.txt
   562 /mnt/c/soft/dg/edited.txt

Wed Jul 23 14:15:41 EDT 2025
   745 /mnt/c/soft/dg/all.txt
   519 /mnt/c/soft/dg/edited.txt

Wed Jul 23 16:22:06 EDT 2025
   668 /mnt/c/soft/dg/all.txt
   448 /mnt/c/soft/dg/edited.txt

Wed Jul 23 16:23:16 EDT 2025
   620 /mnt/c/soft/dg/all.txt
   430 /mnt/c/soft/dg/edited.txt

Wed Jul 23 16:41:19 EDT 2025
   597 /mnt/c/soft/dg/all.txt
   415 /mnt/c/soft/dg/edited.txt
