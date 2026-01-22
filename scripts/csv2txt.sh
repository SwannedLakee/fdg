cd /storage/emulated/0/Download
for f in *.csv; do mv -- "$f" "${f%.csv}.txt"; done
