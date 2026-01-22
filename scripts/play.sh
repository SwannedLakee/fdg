#!/data/data/com.termux/files/usr/bin/sh
echo enter X
read x
n=1
termux-open-url "https://f.dhamma.gift/memorize/?rp=true&q=Mn91#14.4"
while true; 
do 
echo $n
#play-audio "/storage/emulated/0/Download/Sutta Audio/mn91.mp3";  
termux-open "/storage/emulated/0/Download/Sutta Audio/mn91.mp3";   
((n++))
sleep $x 
done
