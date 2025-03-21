#!/bin/bash -i

#core
cd /data/data/com.termux/files/usr/share/apache2/default-site/htdocs/suttacentral.net/sc-data/sc_bilara_data/root/pli/ms/

find sutta/mn sutta/sn sutta/dn sutta/an sutta/kn/thig sutta/kn/thag sutta/kn/dhp sutta/kn/ud sutta/kn/snp sutta/kn/iti vinaya/pli-tv-bu-vb/ vinaya/pli-tv-bi-vb/ -type f -name "*.json" | xargs cat | cj | tr " " "\n" | sed -E 's/^[[:punct:]]+//; s/[[:punct:]]+$//' | grep -v "^$" | sed 's/’”/”/g' | sort | uniq -c > ~/fdg/Sutta4NpartKNVinayaVibhangaAllWords.txt

#sutta only (without vinaya)
find sutta/mn sutta/sn sutta/dn sutta/an sutta/kn/thig sutta/kn/thag sutta/kn/dhp sutta/kn/ud sutta/kn/snp sutta/kn/iti -type f -name "*.json" | xargs cat | cj | tr " " "\n" | sed -E 's/^[[:punct:]]+//; s/[[:punct:]]+$//' | grep -v "^$" | sed 's/’”/”/g' | sort | uniq -c > ~/fdg/Sutta4NpartKNAllWords.txt

#variants
cd /data/data/com.termux/files/usr/share/apache2/default-site/htdocs/suttacentral.net/sc-data/sc_bilara_data/variant/pli/ms

find sutta/mn sutta/sn sutta/dn sutta/an sutta/kn/thig sutta/kn/thag sutta/kn/dhp sutta/kn/ud sutta/kn/snp sutta/kn/iti vinaya/pli-tv-bu-vb/ vinaya/pli-tv-bi-vb/ -type f -name "*.json" | xargs cat | cj | tr " " "\n" | sed -E 's/^[[:punct:]]+//; s/[[:punct:]]+$//' | grep -v "^$" | sed 's/’”/”/g' | sort | uniq -c > ~/fdg/Sutta4NpartKNVinayaVibhangaVars.txt

#sutta only (without vinaya)
find sutta/mn sutta/sn sutta/dn sutta/an sutta/kn/thig sutta/kn/thag sutta/kn/dhp sutta/kn/ud sutta/kn/snp sutta/kn/iti -type f -name "*.json" | xargs cat | cj | tr " " "\n" | sed -E 's/^[[:punct:]]+//; s/[[:punct:]]+$//' | grep -v "^$" | sed 's/’”/”/g' | sort | uniq -c > ~/fdg/Sutta4NpartKNVars.txt

exit 0

find thig thag dhp ud snp iti  -type f -name "*.json" | xargs cat | cj | tr " " "\n" | sed -E 's/^[[:punct:]]+//; s/[[:punct:]]+$//' | grep -v "^$" | sed 's/’”/”/g' | sort | uniq -c > ~/fdg/allWordsKNPartUdItiSnpThigThagDhp.txt

