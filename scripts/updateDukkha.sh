#awk -F':' '{print $1}' /mnt/c/soft/dg/all.txt | uniq -c | sort
#cd /var/www/html
#cd $prefix/assets/texts/sutta/
#asset


prefix=/media/c/soft/dg
prefix=/mnt/c/soft/dg

function commonGrep() {

grep -riE "\bсчасть" $prefix/assets/texts/sutta/* | grep -v несчасть | grep -v "долго" | grep -v "богов и людей" #| grep -v  
}

commonGrep > $prefix/all.txt
grep -v ru-o.json $prefix/all.txt | grep edited > $prefix/edited.txt

echo >> $prefix/scripts/updateDukkha.sh
date >> $prefix/scripts/updateDukkha.sh
wc -l $prefix/all.txt $prefix/edited.txt | grep -v total >> $prefix/scripts/updateDukkha.sh
tail $prefix/scripts/updateDukkha.sh
#cd - 

exit 0

grep -f sukh.id  all.txt

for i in `cat sukh.id `; do echo $i ;  grep -ri -m1 $i assets/texts/sutta/; done
#remove doulbes

cd assets/texts/sutta
 for i in `find . -type f  | awk -F'_' '{print $1}' | sort -V| uniq -c | sort -V | awk '{print $1, $2}' | grep -v "^1" | awk '{print $2}'` 
 do 
 ls ${i}_*  
mv ${i}_*sv.json ../svEtc/automatic/
 done

 


Пт 25 июл 2025 08:57:24 EDT
   663 /mnt/c/soft/dg/all.txt
   485 /mnt/c/soft/dg/edited.txt

Пт 25 июл 2025 10:00:34 EDT
   632 /mnt/c/soft/dg/all.txt
   475 /mnt/c/soft/dg/edited.txt

Пт 25 июл 2025 11:26:07 EDT
   627 /mnt/c/soft/dg/all.txt
   472 /mnt/c/soft/dg/edited.txt

Пт 25 июл 2025 11:49:53 EDT
0 /mnt/c/soft/dg/all.txt
0 /mnt/c/soft/dg/edited.txt

Пт 25 июл 2025 11:50:14 EDT
   423 /mnt/c/soft/dg/all.txt
   287 /mnt/c/soft/dg/edited.txt

Пт 25 июл 2025 14:55:23 EDT
   423 /mnt/c/soft/dg/all.txt
   287 /mnt/c/soft/dg/edited.txt

Пт 25 июл 2025 15:46:56 EDT
   361 /mnt/c/soft/dg/all.txt
   235 /mnt/c/soft/dg/edited.txt

Сб 26 июл 2025 07:16:06 EDT
   277 /mnt/c/soft/dg/all.txt
   176 /mnt/c/soft/dg/edited.txt

Сб 26 июл 2025 20:02:57 EDT
  168 /mnt/c/soft/dg/all.txt
  116 /mnt/c/soft/dg/edited.txt
