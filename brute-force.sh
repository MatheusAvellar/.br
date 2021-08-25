#! /bin/bash

# Clear preliminar output file
echo "" > res.txt

echo "Querying SLDs..."
i=0
# For every SLD in the list ({a..z}{a..z} checks aa.br, ab.br, ac.br, ...)
for sld in {0..9}{0..9}{0..9}
do
  i=$((i+1))
  echo -n "$sld.br ($i/1000)  "
  # Kill query if it doesn't finish after 30s
  timeout 30s host $sld.br >> res.txt
  echo -n "[root ✓] "
  # Test for www. as well (eg. unicamp.br)
  timeout 30s host www.$sld.br >> res.txt
  echo "[www ✓]"
done

# Print and save the results
echo "" > out.txt
echo "Done!"
echo "Direct A records --------------"                      | tee -a out.txt
grep -iE "^(www\.)?[a-z0-9\-]+\.br has address" res.txt     | sort -uf | tee -a out.txt
echo "" >> out.txt
echo "Direct AAAA records -----------"                      | tee -a out.txt
grep -iE "^(www\.)?[a-z0-9\-]+\.br has IPv6" res.txt        | sort -uf | tee -a out.txt
echo "" >> out.txt
echo "CNAME records -----------------"                      | tee -a out.txt
grep -iE "^(www\.)?[a-z0-9\-]+\.br is an alias for" res.txt | sort -uf | tee -a out.txt
echo "" >> out.txt
echo "Direct MX records -------------"                      | tee -a out.txt
grep -iE "^(www\.)?[a-z0-9\-]+\.br mail is handled" res.txt | sort -uf | tee -a out.txt
echo "" >> out.txt
echo "Tangential A records ----------"                      | tee -a out.txt
grep -iE "^([a-z0-9\-]+\.){3,}br has address" res.txt       | sort -uf | tee -a out.txt
echo "" >> out.txt
echo "Tangential AAAA records -------"                      | tee -a out.txt
grep -iE "^([a-z0-9\-]+\.){3,}br has IPv6" res.txt          | sort -uf | tee -a out.txt
echo "" >> out.txt
echo "Tangential MX records -------------"                  | tee -a out.txt
grep -iE "^([a-z0-9\-]+\.){3,}br mail is handled" res.txt   | sort -uf | tee -a out.txt

rm res.txt