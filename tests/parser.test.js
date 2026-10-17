const P = require('../parser.js');
const cases = [
 ['Ramesh ki 200 bori aayi lot 45 chamber 3', 'Stock', {'In/Out':'IN','Farmer/Party':'Ramesh','Bags':200,'Lot No':45,'Chamber':3}],
 ['रमेश की 200 बोरी आई लॉट 45 चेंबर 3', 'Stock', {'In/Out':'IN','Farmer/Party':'रमेश','Bags':200,'Lot No':45,'Chamber':3}],
 ['रमेश की दो सौ बोरी आई लॉट पैंतालीस चेंबर तीन', 'Stock', {'Bags':200,'Lot No':45,'Chamber':3}],
 ['सुरेश यादव के 150 बोरे निकाले लॉट नंबर 112', 'Stock', {'In/Out':'OUT','Farmer/Party':'सुरेश यादव','Bags':150}],
 ['लॉट 78 से 50 बोरी निकली', 'Stock', {'In/Out':'OUT','Bags':50,'Lot No':78}],
 ['Mohan Lal ke 320 bag chipsona chamber 5 mein rakhe', 'Stock', {'In/Out':'IN','Farmer/Party':'Mohan Lal','Bags':320,'Chamber':5,'Variety':'Chipsona'}],
 ['राम सिंह की डेढ़ सौ बोरी 3797 चेंबर 2 में आई', 'Stock', {'Bags':150,'Chamber':2,'Variety':'3797','Farmer/Party':'राम सिंह'}],
 ['चेंबर 2 टेंपरेचर 3.5 डिग्री ह्यूमिडिटी 90', 'Chamber Readings', {'Chamber':2,'Temperature (°C)':3.5,'Humidity (%)':90}],
 ['chamber 2 temperature 3.5 degree humidity 90', 'Chamber Readings', {'Chamber':2,'Temperature (°C)':3.5,'Humidity (%)':90}],
 ['चेंबर चार का तापमान साढ़े तीन डिग्री नमी अट्ठासी प्रतिशत', 'Chamber Readings', {'Chamber':4,'Temperature (°C)':3.5,'Humidity (%)':88}],
 ['चेंबर 1 में तीन पॉइंट दो डिग्री', 'Chamber Readings', {'Chamber':1,'Temperature (°C)':3.2}],
 ['चेंबर 6 4°C 92%', 'Chamber Readings', {'Chamber':6,'Temperature (°C)':4,'Humidity (%)':92}],
 ['meter 1 reading 45210', 'Power', {'Meter No':1,'Meter Reading':45210}],
 ['मीटर रीडिंग 45210', 'Power', {'Meter Reading':45210}],
 ['aaj bijli 4 ghante gayi, DG 3 ghante chala', 'Power', {'Power Cut (hrs)':4,'DG Hours':3}],
 ['आज बिजली चार घंटे गई डीजी तीन घंटे चला 25 लीटर डीजल लगा', 'Power', {'Power Cut (hrs)':4,'DG Hours':3,'Diesel (L)':25}],
 ['जनरेटर ढाई घंटे चला', 'Power', {'DG Hours':2.5}],
 ['डीजल 40 लीटर डाला', 'Power', {'Diesel (L)':40}],
 ['लाइट 2 घंटे 30 मिनट कटी', 'Power', {'Power Cut (hrs)':2.5}],
 ['Sharma ji se 20000 mile', 'Payments', {'Type':'Received','Party':'Sharma Ji','Amount (₹)':20000}],
 ['शर्मा जी से बीस हजार मिले', 'Payments', {'Type':'Received','Party':'शर्मा जी','Amount (₹)':20000}],
 ['शर्मा जी से 20,000 रुपये मिले कैश', 'Payments', {'Amount (₹)':20000,'Mode':'Cash'}],
 ['रमेश को 5000 उधार दिए', 'Payments', {'Type':'Udhar Given','Party':'रमेश','Amount (₹)':5000}],
 ['ramesh ko 5 hazar udhar diye', 'Payments', {'Type':'Udhar Given','Party':'Ramesh','Amount (₹)':5000}],
 ['सुरेश से किराया डेढ़ लाख मिला ऑनलाइन', 'Payments', {'Type':'Rent Received','Party':'सुरेश','Amount (₹)':150000,'Mode':'Online'}],
 ['मजदूरी में 3500 खर्च हुए', 'Payments', {'Type':'Expense','Amount (₹)':3500}],
 ['diesel ka kharcha 8000 rupaye', 'Payments', {'Type':'Expense','Amount (₹)':8000}],
 ['दो लाख पचास हजार किराया मिला राकेश से', 'Payments', {'Type':'Rent Received','Amount (₹)':250000,'Party':'राकेश'}],
 ['ढाई लाख रुपये गुप्ता जी से मिले चेक से', 'Payments', {'Amount (₹)':250000,'Mode':'Cheque'}],
 ['सवा लाख का पेमेंट बिजली बिल का किया', 'Payments', {'Type':'Expense','Amount (₹)':125000}],
 ['200 बोरी का किराया 20000 मिला महेश से', 'Payments', {'Type':'Rent Received','Amount (₹)':20000}],
 ['कल अमोनिया गैस चेक करवानी है', 'Notes', {}],
 ['मुनीम जी छुट्टी पर हैं', 'Notes', {}],
];
let pass=0, fail=0;
for (const [s, type, exp] of cases) {
  const r = P.parse(s); let ok = r.type === type; const bad=[];
  for (const k in exp) if (String(r.fields[k]) !== String(exp[k])) { ok=false; bad.push(k+': got '+JSON.stringify(r.fields[k])+' want '+JSON.stringify(exp[k])); }
  if (r.type!==type) bad.unshift('type got '+r.type+' '+JSON.stringify(r.scores));
  ok ? pass++ : fail++;
  console.log((ok?'PASS':'FAIL')+' | '+s+' -> '+r.type+' '+JSON.stringify(r.fields)+(bad.length?'\n     '+bad.join('; ')+' | norm: '+r.normalized:''));
}
console.log(`\n${pass} pass, ${fail} fail`);
