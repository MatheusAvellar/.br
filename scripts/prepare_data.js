/* To run, from root folder: $ node ./scripts/create_whois.js */
console.log(process.cwd());

const fs = require("fs");

const domains = fs.readFileSync("./zone/br.txt", "utf-8")
	.split("\n")
	.map(v => v.trim().replaceAll("\r", ""))
	.filter(v => v.length);
const whois = JSON.parse(fs.readFileSync("./whois.json", "utf-8"));
/*
 * `whois` is an array of the following format:
whois = [
	{
		"domain": "___.br",
		"created": "20020101"
	},
	...
]
 */

// Let's create `br.subdominios.txt` and `br.dominios.txt` files, with
// all subdomains and non-subdomains respectively
// `whois` will only contain non-subdomains; so we just need the difference
// between domains in `whois` and domains in `domains`
const all_set = new Set(domains);
const domains_set = new Set(whois.map(obj => obj["domain"].trim()))
// gov.br is an exception, it has no whois due to originally being a subdomain
domains_set.add("gov.br");
const subdomains_set = new Set([...all_set].filter(x => !domains_set.has(x)));

const all_subdomains = [...subdomains_set];
all_subdomains.sort();
const all_non_subdomains = [...domains_set];
all_non_subdomains.sort();

function callback(err) {
	if(err) throw err;
	console.log("Wrote subdomains file");
}

const subdomains_str = all_subdomains.join('\n');
fs.writeFile("./zone/br.subdominios.txt", subdomains_str, callback);
fs.writeFile("./public/br.subdominios.txt", subdomains_str, callback);

const non_subdomains_str = all_non_subdomains.join('\n');
fs.writeFile("./zone/br.dominios.txt", non_subdomains_str, callback);
fs.writeFile("./public/br.dominios.txt", non_subdomains_str, callback);

fs.copyFile("./zone/br.txt", "./public/br.txt", (err) => {
	if(err) throw err;
	console.log("Copied 'br.txt' from zone/ to public/");
});
fs.copyFile("./zone/br.zone", "./public/br.zone", (err) => {
	if(err) throw err;
	console.log("Copied 'br.zone' from zone/ to public/");
});

// Manually include subdomains we know the creation date of
whois.push({ "domain": "leilao.br", "created": "20231216" });
whois.push({ "domain": "api.br",    "created": "20250814" });
whois.push({ "domain": "ia.br",     "created": "20250814" });
whois.push({ "domain": "social.br", "created": "20250814" });
whois.push({ "domain": "xyz.br",    "created": "20250814" });

// Join both all domains and whois results into single JSON to give EJS
const json_str = JSON.stringify({
	domains: domains,
	whois: whois
}, null, '\t');
fs.writeFile("./data.json", json_str, (err) => {
	if(err) throw err;
	console.log("Created data.json file");
});
