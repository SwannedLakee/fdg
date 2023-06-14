#install Termux
#open it 
#then run: 
# pkg install -y git
# mkdir -p $PREFIX/share/apache2/default-site/htdocs
# cd $PREFIX/share/apache2/default-site/htdocs
# git clone https://github.com/o28o/fdg.git ./
# bash ./scripts/install-android.sh

#PREFIX=/data/data/com.termux/files/usr/
httpdconf=$PREFIX/etc/apache2/httpd.conf
httpdtdir=$PREFIX/share/apache2/default-site/htdocs

echo "installing php-apache apache2 zip pv wget git iconv w3m jq"
pkg install -y php-apache apache2 zip pv wget git iconv w3m jq

while true; do
    read -p "Are you going to perform searches in Thai? Y or N" yn
    case $yn in
        [Yy]* ) 
   echo "installing python3.9 and aksharamukha. For searches in Thai. 
   This will overwrite the default python link. 
You may fix it with these commands:
rm \$PREFIX/bin/python
ln -s \$PREFIX/bin/python(version installed previously) \$PREFIX/bin/python
"     
pkg install -y tur-repo
pkg update
pkg install -y python3.9
rm $PREFIX/bin/python
ln -s $PREFIX/bin/python3.9 $PREFIX/bin/python

echo "install aksharamukha. needed if youll make requests in Thai"
cd 
python -m venv aksharamukha 
aksharamukha/bin/pip install aksharamukha
        break;;
        [Nn]* ) break;;
        * ) echo "Please answer yes or no.";;
    esac
done

#fix php based on this [article](https://parzibyte.me/blog/en/2019/04/28/install-apache-php-7-android-termux/#Step_2_Install_Apache_and_PHP)

sed -i "/mpm_worker_module/s@LoadModule@#LoadModule@g" $httpdconf 
echo "LoadModule mpm_prefork_module libexec/apache2/mod_mpm_prefork.so
LoadModule php_module /data/data/com.termux/files/usr/libexec/apache2/libphp.so
      <FilesMatch \.php$>
        SetHandler application/x-httpd-php
      </FilesMatch>
      
      <IfModule dir_module>
          DirectoryIndex index.php index.html index.htm
      </IfModule>
      
      LoadModule rewrite_module libexec/apache2/mod_rewrite.so
      ServerName localhost:8080
      ServerName 127.0.0.1:8080" >> $httpdconf
  
cd $httpdtdir
rm ./index.html
echo "removed apache demo page"
mkdir result 
cd ru 
ln -s ../result ./result
cd ..
#current suttacentral.net
echo "downloading suttacentral.net"
cd ..
rm -rf suttacentral.net
mkdir suttacentral.net 
cd suttacentral.net 
git clone https://github.com/suttacentral/sc-data.git 

#accesstoinsight.org 
cd ..
echo "downloading accesstoinsight.org"
rm -rf accesstoinsight.org 
wget http://accesstoinsight.org/tech/download/ati.zip
echo "unzipping"
unzip ati.zip 
mv ati ./accesstoinsight.org
rm ati.zip

#legacy suttacentral.net 
echo "downloading legacy.suttacentral.net"
rm -rf legacy.suttacentral.net
wget https://legacy.suttacentral.net/exports/sc-offline-2016-11-30_16:03:42.zip
echo "unzipping"
unzip sc-offline-2016-11-30_16\:03\:42.zip 
mv sc-offline-2016-11-30_16\:03\:42/ legacy.suttacentral.net  
rm sc-offline-2016-11-30_16\:03\:42.zip 

#test run
echo "test run"
echo
bash ./scripts/finddhamma.sh adhivacanasamphasso 

echo "apachectl start" >> ~/.profile
echo "added apache webserver (httpd) to autostart each time you open temrux app"
echo 
echo "press anykey to start apache and open fdg offline

if you will use termux only for dhamma.gift you may want trun this command.
it will open find.dhamma.gift offline automatically

echo 'termux-open-url http://localhost:8080/' >> ~/.profile


if localhost:8080 is unavailable. you may run 

apachectl stop && apachectl start

without restarting Termux
press anykey to finish the setup
"
read 
apachectl start
termux-open-url http://localhost:8080/

exit 0


#update

#cleanup sc repo from unused texts
#git clone https://github.com/suttacentral/sc-data.git ./
git pull
git rm -r --cached .


alias apa='cd /data/data/com.termux/files/usr/share/apache2/default-site/htdocs'
alias apa='cd /home/a0092061/domains/find.dhamma.gift/public_html'

initsize=`du -hs suttacentral.net/`
echo $initsize
cd suttacentral.net/

apa 
cd ./suttacentral.net/sc-data/html_text
ls
ls | grep -Ev "pli|ru|th|en|san" | xargs rm -rf
ls

apa
cd ./suttacentral.net/sc-data/sc_bilara_data/translation
ls
ls | grep -Ev "pli|ru|th|en|san" | xargs rm -rf
ls
apa
cd ./suttacentral.net/sc-data/sc_bilara_data/html
ls
ls | grep -Ev "pli|ru|th|en|san" | xargs rm -rf
ls

apa
cd ./suttacentral.net/sc-data/sc_bilara_data/root
ls
ls | grep -Ev "pli|ru|th|en|san" | xargs rm -rf
ls

apa
rm -rf ./suttacentral.net/sc-data/.git
echo $initsize
du -hs ./suttacentral.net

#apache config backup
cp /data/data/com.termux/files/usr/etc/apache2/httpd.conf /data/data/com.termux/files/usr/share/apache2/default-site/htdocs/config/

#to refresh theravada.ru run
mkdir theravada.ru && cd theravada.ru
wget -r --no-check-certificate -P ./ --no-parent https://theravada.ru/Teaching/canon.htm
cd theravada.ru/Teaching/Canon/Suttanta   
for i in `find . -name  "*htm*" -type f`; do  
    echo $i; 
    iconv -f windows-1251 $i > ../tmp
    mv -f ../tmp $i
    sed -i 's@windows-1251@utf-8@g' $i
    done
    
    #count metaphorcount 
metaphorkeys="seyyathāpi|adhivacan|ūpama|opama|opamma"
nonmetaphorkeys="adhivacanasamphass|adhivacanapath|ekarūp|tathārūpa|āmarūpa|\brūpa|evarūpa|\banopam|\battūpa|\bnillopa|opamaññ"

#refresh metaphors 
nicevalue=1
for i in `find . -name "*.json" | sort -V`
do 
metaphorcount=`grep -E -i "$metaphorkeys" $i | nice -$nicevalue grep -vE "$nonmetaphorkeys" | tr -s ' '  '\n' | nice -$nicevalue grep -iE "$metaphorkeys" | wc -l` 
sankhamEvamcount=`cat $i | tr '\n' '\a' | grep -ioc 'saṅkhaṁ gacchati.*Evamevaṁ'`
metaphorcount=$(( $metaphorcount + $sankhamEvamcount ))

echo $i $metaphorcount >> ~/metphrcount_vinaya.txt
done 

#check and fix links if needed 
cd /data/data/com.termux/files/usr/share/apache2/default-site/htdocs/ru
ln -s ../assets ./assets 
ln -s ../sc ./sc
ln -s ../scripts ./scripts
ln -s ../result ./result

#tests
curl http://localhost:8080/sc/translator-lookup.php?fromjs=sutta/sn/sn56/sn56.11
curl http://localhost:8080/sc/api.php?fromjs=sutta/dn/an1.1-10&type=A
curl http://localhost:8080/sc/extralinks.php?fromjs=dn22

curl https://find.dhamma.gift/sc/translator-lookup.php?fromjs=sutta/mn/mn1
curl https://find.dhamma.gift/sc/api.php?fromjs=sutta/dn/dn22&type=A
curl https://find.dhamma.gift/sc/extralinks.php?fromjs=dn22

curl http://localhost/sc/translator-lookup.php?fromjs=sutta/sn/sn56/sn56.11
curl http://localhost/sc/api.php?fromjs=sutta/dn/dn22&type=A
curl http://localhost/sc/extralinks.php?fromjs=dn22

http://localhost:8080/ru/sc/index.js

git rm -r --cached .

vmtouch -dl /var/www/suttacentral.net/sc-data/sc_bilara_data/root/pli/ms/sutta
vmtouch -dl /var/www/suttacentral.net/sc-data/sc_bilara_data/root/pli/ms/vinaya
vmtouch -dl /var/www/suttacentral.net/sc-data/sc_bilara_data/translation/en/sujato/sutta
vmtouch -dl /var/www/suttacentral.net/sc-data/sc_bilara_data/translation/en/brahmali/vinaya
vmtouch -dl /var/www/suttacentral.net/sc-data/html_text/ru/pli/sutta
vmtouch -dl /var/www/suttacentral.net/sc-data/html_text/th/pli/sutta

vmtouch -dl /var/www/html/sc
vmtouch -dl /var/www/html/o
vmtouch -dl /var/www/html/accesstoinsight.org
vmtouch -dl /var/www/html/archive.php
vmtouch -dl /var/www/html/assets
vmtouch -dl /var/www/html/bw
vmtouch -dl /var/www/html/config
vmtouch -dl /var/www/html/cse.php
vmtouch -dl /var/www/html/history.php
vmtouch -dl /var/www/html/index.php
vmtouch -dl /var/www/html/o
vmtouch -dl /var/www/html/buddhadust.net
vmtouch -dl /var/www/html/README.md
vmtouch -dl /var/www/html/ru
vmtouch -dl /var/www/html/sc
vmtouch -dl /var/www/html/scripts
vmtouch -dl /var/www/html/sitemap.xml
vmtouch -dl /var/www/html/theravada.ru
vmtouch -dl /var/www/html/tipitaka.theravada.su


vmtouch /var/www/html/

 wget --mirror --convert-links --page-requisites --no-parent https://dhamma.ru/canon/
 wget --mirror --convert-links --page-requisites --no-parent http://xn--80aaaglc1fo1a.xn--p1ai/palicanon


wget -r --no-check-certificate -P ./ --no-parent http://xn--80aaaglc1fo1a.xn--p1ai/palicanon
wget -r --no-check-certificate -P ./ --no-parent https://dhamma.ru/canon/





wget \
     --recursive \
     --no-clobber \
     --page-requisites \
     --html-extension \
     --convert-links \
     --restrict-file-names=windows \
     --no-parent \
          http://xn--80aaaglc1fo1a.xn--p1ai/palicanon


wget --recursive --no-clobber --page-requisites --html-extension --convert-links --no-parent --no-host-directories --reject=pdf,docx,doc,zip,odt,rtf http://xn--80aaaglc1fo1a.xn--p1ai/palicanon

wget --recursive --no-clobber --page-requisites --html-extension --convert-links --no-parent --no-host-directories --reject=pdf,docx,doc,zip,odt,rtf http://probud.narod.ru/dop.html


wget --recursive --no-clobber --page-requisites --html-extension --convert-links --no-parent --no-host-directories https://buddhadust.net/dhamma-vinaya/bd/dhamma-vinaya.htm