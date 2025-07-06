#!/bin/bash

inputfile=./zone/br.txt
outputfile=./zone/br.zone
> $outputfile

total=$(wc -l $inputfile | awk '{ print $1 }')
echo "Found $total SLDs"

echo "Querying SLDs..."
i=0
timeout=60
while read sld_no_dot; do
	i=$((i+1))

	sld="$sld_no_dot."
	sld_no_br=${sld_no_dot:0:-3}

	echo -n "$sld ($i/$total):  "
	echo ";; $sld" >> $outputfile
	echo -n "SOA"

	# Ask Google for the SOA (@x.dns.br doesn't return SOA for some reason)
	timeout 61s dig @8.8.8.8 $sld SOA +noall +answer +authority +additional +time=$timeout >> $outputfile
	# Ask DNS.br for the NS and NSEC entries
	echo -n ", NS"
	timeout 61s dig @e.dns.br $sld NS +noall +answer +authority +additional +time=$timeout >> $outputfile

	# Ask Google for A, AAAA, MX
	echo -n ", A"
	timeout 61s dig @8.8.8.8 $sld A +noall +answer +time=$timeout >> $outputfile
	echo -n ", AAAA"
	timeout 61s dig @8.8.8.8 $sld AAAA +noall +answer +time=$timeout >> $outputfile
	echo -n ", MX"
	timeout 61s dig @8.8.8.8 $sld MX +noall +answer +time=$timeout >> $outputfile

	# Ask Google for www A and AAAA; CNAME will come on its own
	echo -n ", wA"
	timeout 61s dig @8.8.8.8 www.$sld A +noall +answer +time=$timeout >> $outputfile
	echo -n ", wAAAA"
	timeout 61s dig @8.8.8.8 www.$sld AAAA +noall +answer +time=$timeout >> $outputfile
	echo -n ", wMX"
	timeout 61s dig @8.8.8.8 www.$sld MX +noall +answer +time=$timeout >> $outputfile

	# Query NSEC for "<SLD>#.br" (i.e. zone walking) so we get NSEC pointing to
	# the next SLD. Otherwise, I'm getting subdomains from the SLD in the response:
	#     9guacu.br.	900	IN	NSEC	bru________.9guacu.br. NS SOA RRSIG NSEC DNSKEY
	# By adding a '#' (smallest printable Unicode codepoint after ! and "), we get:
	#     9guacu.br.	900	IN	NSEC	abc.br. NS DS RRSIG NSEC
	echo ", NSEC"
	timeout 61s dig @e.dns.br NSEC "$sld_no_br#.br." +noall +answer +authority +additional +dnssec +time=$timeout | awk "/^$sld/" >> $outputfile
done < $inputfile;

cp $inputfile ./public/br.txt
cp $outputfile ./public/br.zone
