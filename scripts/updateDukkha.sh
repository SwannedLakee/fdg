#awk -F':' '{print $1}' /mnt/c/soft/dg/all.txt | uniq -c | sort
#cd /var/www/html
#cd $prefix/assets/texts/sutta/
#asset


prefix=/media/c/soft/dg
prefix=/mnt/c/soft/dg

function commonGrep() {

grep -riE "страдан" $prefix/assets/texts/sutta/* | grep -v сострада | grep -v "бедствии, несчастье, страдании, преисподней" | grep -v "страдан.*плач.*бол"
}

commonGrep > $prefix/all.txt
grep -v ru-o.json $prefix/all.txt | grep edited > $prefix/edited.txt

echo >> $prefix/scripts/updateDukkha.sh
date >> $prefix/scripts/updateDukkha.sh
wc -l $prefix/all.txt $prefix/edited.txt | grep -v total >> $prefix/scripts/updateDukkha.sh
tail $prefix/scripts/updateDukkha.sh
#cd - 

exit 0

#remove doulbes

cd assets/texts/sutta
 for i in `find . -type f  | awk -F'_' '{print $1}' | sort -V| uniq -c | sort -V | awk '{print $1, $2}' | grep -v "^1" | awk '{print $2}'` 
 do 
 ls ${i}_*  
mv ${i}_*sv.json ../svEtc/automatic/
 done

 

