/* To run, from root folder: $ node ./scripts/create_whois.js
 * Requires a local whois/ directory on root with a file for each domain
 * containing the output of its `whois` command.
 * The file will look something like this:
--------------------------------------------------------------------------------
% Copyright (c) Nic.br
%  The use of the data below is only permitted as described in
%  full by the Use and Privacy Policy at https://registro.br/upp ,
%  being prohibited its distribution, commercialization or
%  reproduction, in particular, to use it for advertising or
%  any similar purpose.
%  YYYY-MM-DDThh:mm:ss+TT:tt - IP: XXX.XXX.XXX.XXX

domain:      ____.br
owner:       ____
ownerid:     ____
responsible: ____
...
created:     YYYYMMDD #____
changed:     YYYYMMDD
status:      ____
...

% Security and mail abuse issues should also be addressed to
% cert.br, http://www.cert.br/ , respectivelly to cert@cert.br
% and mail-abuse@cert.br
%
% whois.registro.br accepts only direct match queries. Types
% of queries are: domain (.br), registrant (tax ID), ticket,
% provider, CIDR block, IP and ASN.
--------------------------------------------------------------------------------
 * Due to the stated usage restrictions, we only extract creation date. The
 * entirety of the whois files cannot be published, but can easily be
 * reconstructed with the domain list and a bit of patience.
 */

const fs = require("fs");

const WHOIS_DIR = "./whois/";
fs.readdir(WHOIS_DIR, function(err, filenames) {
	if(err) {
		console.log(err);
		return;
	}

	function getLine(line) {
		const splitline = line.split(":");
		const header = splitline[0];
		let value = splitline[1];
		// Get everything before a '#'
		// Eg.: created: "20020101 #2345678"
		//            -> "20020101"
		value = value.split('#')[0].trim();
		// Get everything after a space
		// Eg.: domain:  "icannsãopaulo.br xn--icannsopaulo-7bb.br"
		//            -> "xn--icannsopaulo-7bb.br"
		// Eg.: created: "before 19950101"
		//            -> "19950101"
		value = value.split(' ').at(-1)
		return [ header, value ];
	}

	const fileContents = [];
	for(const filename of filenames) {
		const content = fs.readFileSync(WHOIS_DIR + filename, "utf-8");
		const data = {};
		const lines = content.split("\n");
		for(const line of lines) {
			if(line.length <= 0) continue;
			if(line.charAt(0) == "%") continue;
			if(line.startsWith("domain")
				|| line.startsWith("created")) {
				const [header, value] = getLine(line);
				data[header] = value;
			}
			if(line.startsWith("status"))
				break;
		}
		if(Object.keys(data).length)
			fileContents.push(data);
	}

	const json_str = JSON.stringify(fileContents, null, '\t')
	fs.writeFile("./whois.json", json_str, (err) => {
		if(err) {
			console.error("Error writing file:", err);
			return;
		}
		console.log("Created whois.json file");
	});
});
