#!/bin/bash
#replace for demo data
for i in `ls`
do
sed -i 's@/assets/example/@/assets/example/@g' $i
sed -i 's@href="../../">@href="../../">@g' $i 
sed -i "s@<a href='../../' id='back'>@<a href='../../' id='back'>@g" $i
done
