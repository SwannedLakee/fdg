#cd /var/www/html
prefix=/media/c/soft/dg
prefix=/mnt/c/soft/dg
cd $prefix/assets/texts/sutta

#asset
grep -riE "\bстрадан" * | grep -v ru-o.json > $prefix/all.txt
grep -riE "\bстрадан" * | grep -v ru-o.json | grep edited > $prefix/edited.txt


echo >> $prefix/scripts/updateDukkha.sh
date >> $prefix/scripts/updateDukkha.sh
wc -l $prefix/all.txt $prefix/edited.txt | grep -v total >> $prefix/scripts/updateDukkha.sh
tail $prefix/scripts/updateDukkha.sh
cd - 


exit 0

Wed Jul 23 01:58:52 AM +05 2025
  1090 /var/www/html/all.txt
   265 /var/www/html/edited.txt

Wed Jul 23 02:12:37 AM +05 2025
  1056 /var/www/html/all.txt
   251 /var/www/html/edited.txt


Tue Jul 22 18:31:26 USEDT 2025
        0 /media/c/soft/dg/all.txt
        0 /media/c/soft/dg/edited.txt

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
