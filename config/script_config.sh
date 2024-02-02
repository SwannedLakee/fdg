#################################
# 'anāvattidhammaṁ me cittaṁ 
# kāmabhavāyā’ti paññāya cittaṁ
# suparicitaṁ hoti;
# ‘anāvattidhammaṁ me cittaṁ 
# rūpabhavāyā’ti paññāya cittaṁ 
# suparicitaṁ hoti;
# ‘anāvattidhammaṁ me cittaṁ 
# arūpabhavāyā’ti paññāya cittaṁ 
# suparicitaṁ hoti.
########## an9.25 ##############

export LANG=en_US.UTF-8

if [[ "`uname -a`" == *"Android"* ]]; then 
sitename=http://localhost:8080
nicevalue=1
mode=offline
fontawesomejs='src="/assets/js/fontawesome.6.1.all.js" defer'
apachesitepath=/data/data/com.termux/files/usr/share/apache2/default-site/htdocs
tmpdir=$apachesitepath/result
suttapath=$apachesitepath/suttacentral.net/

linkforthsu=/tipitaka.theravada.su
linkforthru=/theravada.ru
linkforthai=/legacy.suttacentral.net/sc/th/
linkforthaiext='.html'
linkforsi=https://suttacentral.net/
linkforsiext=/si/zoysa
linkforru=/legacy.suttacentral.net/sc/ru/
linkforruext='.html'
urllinkpli=
urllinken='/sc/?q='
urllinkenend='&lang=pli-eng'
urllinkbw=/bw/

wbefore=1
wafter=3
linesafter=0
minlength=3
truncatelength=30
filesizenooverwrite=100000000000
maxmatchesbg=3000
archivenumber=84
minmatchesforonline=5
defaultTimeout=60
multiplier=1

elif [[ "`uname -a`" == *"CentOS-Server"* ]];then
sitename=http://localhost
nicevalue=1
mode=online
apachesitepath=/var/www/html
tmpdir=/tmp
#tmpdir=$apachesitepath/result
suttapath=$apachesitepath/suttacentral.net/

fontawesomejs='src="https://kit.fontawesome.com/a2bd6cd99e.js" crossorigin="anonymous"'
linkforthsu=https://tipitaka.theravada.su
linkforthru=https://theravada.ru
linkforthai=https://suttacentral.net/
linkforthaiext=/th/siam_rath
linkforsi=https://suttacentral.net/
linkforsiext=/si/zoysa
linkforru=https://suttacentral.net/
linkforruext=
urllinkpli=http://find.dhamma.gift/
urllinkenmid=
#urllinkbwend=.html
urllinken='/sc/?q='
urllinkenend='&lang=pli-eng'
urllinkbw=/bw/

wbefore=1
wafter=3
linesafter=0
minlength=2
truncatelength=30
filesizenooverwrite=700000
maxmatchesbg=3500
archivenumber=91

multiplier=2
minmatchesforonline=15
defaultTimeout=30
elif [[ "`uname -a`" == *"Ubuntu"* ]] ; then 
sitename=http://localhost
nicevalue=1
mode=offline
apachesitepath=/var/www/html
tmpdir=/tmp
suttapath=$apachesitepath/suttacentral.net/
fontawesomejs='src="https://kit.fontawesome.com/a2bd6cd99e.js" crossorigin="anonymous"'
linkforthsu=/tipitaka.theravada.su
linkforthru=/theravada.ru
linkforthai=/legacy.suttacentral.net/sc/th/
linkforthaiext='.html'
linkforsi=https://suttacentral.net/
linkforsiext=/si/zoysa
linkforru=/legacy.suttacentral.net/sc/ru/
linkforruext='.html'
urllinkpli=
urllinken='/sc/?q='
urllinkenend='&lang=pli-eng'
urllinkbw=/bw/

wbefore=1
wafter=3
linesafter=0
minlength=2
truncatelength=30
filesizenooverwrite=1000000000000
maxmatchesbg=300000
archivenumber=280
archivenumber=91
multiplier=2
minmatchesforonline=15
defaultTimeout=30
elif [[ "`uname -a`" == *".from.sh"* ]]; then
sitename=http://f2.dhamma.gift
mode=online
nicevalue=19
fontawesomejs='src="https://kit.fontawesome.com/a2bd6cd99e.js" crossorigin="anonymous"'
apachesitepath=/home/a0902785/domains/find.dhamma.gift/public_html/
tmpdir=/tmp
suttapath=/home/a0902785/domains/find.dhamma.gift/suttacentral.net/

linkforthsu=https://tipitaka.theravada.su
linkforthru=https://theravada.ru
linkforthai=https://suttacentral.net/
linkforthaiext=/th/siam_rath
linkforru=https://suttacentral.net/

#for find in all theravada.ru suttas
scriptdir=$rootpath
outputdir=$output

#for allwords.sh
homedir=$rootpath
outputdiraw=$output/allwords

urllinkpli=http://f2.dhamma.gift/
urllinken=https://suttacentral.net/
urllinkenmid=/en/
urllinkenend='?layout=linebyline'
urllinkbw=/bw/
urllinkbwend=.html

wbefore=1
wafter=3
linesafter=0
minlength=3
truncatelength=30
filesizenooverwrite=10000000
maxmatchesbg=2000
archivenumber=31
multiplier=2
minmatchesforonline=15
defaultTimeout=30

fi

#common vars

filelimit=500 
procqnty=4
rootpath=$apachesitepath/scripts
output=$apachesitepath/result/
history="$apachesitepath/result/.history"
sntoccsv="$apachesitepath/assets/texts/sn_toc.csv"
templatefolder=$apachesitepath/assets/templates
textinfofolder=$apachesitepath/assets/texts
bwlocation=$apachesitepath/bw/
indexesfile=$apachesitepath/assets/texts/text_indexes.txt
thsucurldn=$apachesitepath/assets/texts/dn_curl_toc.html
thsulocation=$apachesitepath/tipitaka.theravada.su/
searchdir=$apachesitepath/theravada.ru/Teaching/Canon/Suttanta/Texts

function pvlimit {
pv -L 1m -q
}
function clearargs {
sed -e 's/-pli //g' -e 's/-pi //g' -e 's/-ru //g' -e 's/-en //g' -e 's/-abhi //g' -e 's/-vin //g' -e 's/-th //g' -e 's/-si //g' -e 's/^ //g' -e 's/-kn //g' -e 's/-all //g' -e 's/-tru //g' -e 's/-conv //g' | sed 's/-oru //g' | sed 's/-ogr //g' | sed 's/-oge //g'| sed 's/-nbg-.* //g' | sed 's/ -exc.*//g' | sed 's/-l[ab][0-9]* //g' | sed 's/-defall //g' | sed 's/-def //g' | sed 's/-sml //g' |  sed 's/-b //g' | sed 's/-onl //g' | sed 's/-nm[0-9]* //g' 
}

function removefilenames {
sed -Ei 's%^.*(.json|.html):%%g' $basefile 
sed -i 's/$/<br>/' $basefile
(echo '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
</head>
<body>' && cat $basefile ) > tmp && mv tmp $basefile

echo "</body>
</html>" >> $basefile
newbasefilename=`echo $basefile | sed 's@_fn.tmp@_raw.html@'`
mv $basefile $newbasefilename
basefile=$newbasefilename
}
  
function removeindex {
sed -e 's/:.*": "/": "/' #      sed 's/ /:/1' | awk -F':'  '{print $1, $3}'
}

function tohtml {
tee -a ${table} > /dev/null
} 

function sedexpr {
sed 's/\.$//g' | sed 's/:$//g' | sed 's/[,!?;«—”“‘"]/ /g' | sed 's/)//g' | sed 's/(//g'  
}

function cleanwords {
  cat $file $variant | removeindex | clearsed | sedexpr | awk '{print tolower($0)}' |grep -Eio$grepgenparam "[^ ]*$pattern[^ ]*"
  }
  
function getwords {
cleanwords | awk '!seen[tolower($0)]++'  
cleanwords | tee -a $tempfilewords > /dev/null
}

function highlightpattern {
sed -E "s@$patternForHighlight@<b>&</b>@gI"
}

