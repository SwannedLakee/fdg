#!/bin/bash
source ./config/script_config.sh --source-only

cd $suttapath/sc-data
git pull #| grep "translation/ru"
cd $apachesitepath


Pali="$suttapath/sc-data/sc_bilara_data/root/pli/ms/sutta"
Trn="$apachesitepath/assets/texts/sutta"
TrnNew="$suttapath/sc-data/sc_bilara_data/translation/ru"

function ShowDiff() {
cd $TrnDir 2>/dev/null
TrnFolders=$(find . -type d | sort -V)
#echo $TrnFolders
cd $TrnNewDir 2>/dev/null
TrnFolders=$(printf "%s\n%s" "$TrnFolders" "$(find . -type d)" | sort -u -V)
#echo $TrnFolders
TrnFolders=${TrnFolders//./}

for i in $TrnFolders ; do 
root=$(ls $PaliDir/$i | wc -l) 
asset=$(ls $TrnDir/$i 2>/dev/null | wc -l ) 
new=$(ls $TrnNewDir/$i 2>/dev/null | wc -l)
percentdone=$(awk "BEGIN {printf \"%.0f\", ($asset/$root)*100}")
check=$(if [ "$root" -eq "$asset" ]; then echo $asset;
else
echo $root/$asset/$nee;
fi)

upd=$(if [ "$new" -gt "$asset" ]; then echo 'Updated!'; $TrnDir/$i 2>/dev/null ; cp $TrnNewDir/$i/* $TrnDir/$i/ ; fi)

echo "$i $(if [ "$percentdone" -eq 100 ]; then 
echo done $check 
else 
echo $percentdone% $root $asset $new $upd 
fi)"

#$(if [ "$root" -eq "$asset" ]; then echo '100% done'; fi)"
#find $i -maxdepth 1 -type f | sort -V 
done
}
echo 'name % root assets newFiles'
echo AN
# Задаем директории для перевода и палийских текстов
PaliDir="$Pali/an"
TrnDir="$Trn/an"
TrnNewDir="$TrnNew/sv/sutta/an"
ShowDiff

echo KN
PaliDir="$Pali/kn"
TrnDir="$Trn/kn"
TrnNewDir="$TrnNew/narinyanievmenenko/sutta/kn"
ShowDiff

echo SN
# Задаем директории для перевода и палийских текстов
PaliDir="$Pali/sn"
TrnDir="$Trn/sn"
TrnNewDir="$TrnNew/sv/sutta/sn"
ShowDiff

#echo any key to run latest-rus.php or ctrl-c to cancel
#cd /data/data/com.termux/files/usr/share/apache2/default-site/htdocs/sc
#php ./latest-rus.php
#echo cp if have new sv files
#read x
#cp suttacentral.net/sc-data/sc_bilara_data/translation/ru/sv/sutta/sn/sn2/* assets/texts/sutta/sn/sn2/