const P = require('../parser.js');
const cases = [
 ['चेंबर नंबर 3 का तापमान 4 डिग्री', 'Chamber Readings', {'Chamber':3,'Temperature (°C)':4}],
 ['5 degree chamber 3', 'Chamber Readings', {'Chamber':3,'Temperature (°C)':5}],
 ['humidity 85 chamber 1', 'Chamber Readings', {'Chamber':1,'Humidity (%)':85}],
 ['chamber 3 mein 5 degree', 'Chamber Readings', {'Chamber':3,'Temperature (°C)':5}],
 ['राजू को दो हजार दिए', 'Payments', {'Type':'Paid','Party':'राजू','Amount (₹)':2000}],
 ['पप्पू की 80 बोरी आलू निकली चेंबर 4 से', 'Stock', {'In/Out':'OUT','Farmer/Party':'पप्पू','Bags':80,'Chamber':4}],
 ['कल शाम मीटर नंबर 2 की रीडिंग 12345 थी', 'Power', {'Meter No':2,'Meter Reading':12345}],
 ['Ramesh 500 udhar diya', 'Payments', {'Type':'Udhar Given','Amount (₹)':500,'Party':'Ramesh'}],
 ['chai pani 200 kharch', 'Payments', {'Type':'Expense','Amount (₹)':200,'Party':'Chai Pani'}],
 ['विनोद कुमार की 1200 बोरी पुखराज लॉट 301 चेंबर 1', 'Stock', {'Bags':1200,'Lot No':301,'Chamber':1,'Variety':'Pukhraj','Farmer/Party':'विनोद कुमार'}],
 ['गुड्डू ने 5000 उधार वापस किए', 'Payments', {'Party':'गुड्डू','Amount (₹)':5000}],
 ['बिजली का बिल 85000 भरा', 'Payments', {'Type':'Expense','Amount (₹)':85000}],
 ['चेंबर 5 माइनस 1 डिग्री', 'Chamber Readings', {'Chamber':5,'Temperature (°C)':-1}],
 ['डीजी 6 घंटे चला', 'Power', {'DG Hours':6}],
 ['जनरेटर में 50 लीटर डीजल डाला और 4 घंटे चला', 'Power', {'Diesel (L)':50,'DG Hours':4}],
 ['बिजली सुबह से 3 घंटे नहीं है', 'Power', {'Power Cut (hrs)':3}],
 ['अजय की चार सौ पचास बोरी आई', 'Stock', {'Bags':450,'Farmer/Party':'अजय'}],
 ['तीन हजार पांच सौ रुपये मजदूरी दी', 'Payments', {'Amount (₹)':3500}],
 ['Ramesh ko de do 500', 'Payments', {'Amount (₹)':500}],
 ['आज 25 मजदूर आए', 'Notes', {}],
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
