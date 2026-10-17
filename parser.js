/* Cool Space Voice Entry - rule-based Hindi/Hinglish parser (no paid APIs).
   Works in browser (window.CSParser) and Node (module.exports). */
(function (root) {
  'use strict';

  var HEADERS = {
    'Stock': ['Timestamp', 'Date', 'In/Out', 'Farmer/Party', 'Bags', 'Lot No', 'Chamber', 'Variety', 'Entered By', 'Raw Transcript', 'Entry ID'],
    'Chamber Readings': ['Timestamp', 'Date', 'Chamber', 'Temperature (°C)', 'Humidity (%)', 'Entered By', 'Raw Transcript', 'Entry ID'],
    'Power': ['Timestamp', 'Date', 'Meter No', 'Meter Reading', 'DG Hours', 'Diesel (L)', 'Power Cut (hrs)', 'Entered By', 'Raw Transcript', 'Entry ID'],
    'Payments': ['Timestamp', 'Date', 'Type', 'Party', 'Amount (₹)', 'Mode', 'Entered By', 'Raw Transcript', 'Entry ID'],
    'Notes': ['Timestamp', 'Date', 'Note', 'Entered By', 'Raw Transcript', 'Entry ID']
  };
  // Editable (parsed) fields per tab, in display order
  var FIELDS = {
    'Stock': ['In/Out', 'Farmer/Party', 'Bags', 'Lot No', 'Chamber', 'Variety'],
    'Chamber Readings': ['Chamber', 'Temperature (°C)', 'Humidity (%)'],
    'Power': ['Meter No', 'Meter Reading', 'DG Hours', 'Diesel (L)', 'Power Cut (hrs)'],
    'Payments': ['Type', 'Party', 'Amount (₹)', 'Mode'],
    'Notes': ['Note']
  };

  // ---------- number words ----------
  var DEV = ['शून्य','एक','दो','तीन','चार','पांच','छह','सात','आठ','नौ','दस','ग्यारह','बारह','तेरह','चौदह','पंद्रह','सोलह','सत्रह','अठारह','उन्नीस',
    'बीस','इक्कीस','बाईस','तेईस','चौबीस','पच्चीस','छब्बीस','सत्ताईस','अट्ठाईस','उनतीस','तीस','इकतीस','बत्तीस','तैंतीस','चौंतीस','पैंतीस','छत्तीस','सैंतीस','अडतीस','उनतालीस',
    'चालीस','इकतालीस','बयालीस','तैंतालीस','चवालीस','पैंतालीस','छियालीस','सैंतालीस','अडतालीस','उनचास','पचास','इक्यावन','बावन','तिरपन','चौवन','पचपन','छप्पन','सत्तावन','अट्ठावन','उनसठ',
    'साठ','इकसठ','बासठ','तिरसठ','चौंसठ','पैंसठ','छियासठ','सडसठ','अडसठ','उनहत्तर','सत्तर','इकहत्तर','बहत्तर','तिहत्तर','चौहत्तर','पचहत्तर','छिहत्तर','सतहत्तर','अठहत्तर','उन्यासी',
    'अस्सी','इक्यासी','बयासी','तिरासी','चौरासी','पचासी','छियासी','सत्तासी','अट्ठासी','नवासी','नब्बे','इक्यानवे','बानवे','तिरानवे','चौरानवे','पचानवे','छियानवे','सत्तानवे','अट्ठानवे','निन्यानवे'];
  var SMALL = {};
  DEV.forEach(function (w, i) { SMALL[w] = i; });
  var EXTRA = {
    // Devanagari spelling variants (after nukta/chandrabindu normalisation)
    'पाँच':5,'पान्च':5,'छः':6,'छे':6,'छै':6,'पन्द्रह':15,'सतरह':17,'उन्निस':19,'बाइस':22,'तेइस':23,'सत्ताइस':27,'अट्ठाइस':28,'अठाईस':28,'चौवालीस':44,'चव्वालीस':44,
    'इक्यावन':51,'तिरेपन':53,'चउवन':54,'सत्तावन':57,'उनसाठ':59,'इकयासी':81,'नवे':90,'इकानवे':91,'निन्यान्वे':99,
    // Roman Hinglish
    'shunya':0,'zero':0,'ek':1,'teen':3,'tin':3,'char':4,'chaar':4,'paanch':5,'panch':5,'paach':5,'chhe':6,'chhah':6,'chah':6,'che':6,'saat':7,'sat':7,'aath':8,'ath':8,'nau':9,'das':10,
    'gyarah':11,'gyara':11,'barah':12,'bara':12,'terah':13,'tera':13,'chaudah':14,'chauda':14,'pandrah':15,'pandra':15,'solah':16,'sola':16,'satrah':17,'satra':17,'atharah':18,'athara':18,'unnis':19,'unees':19,
    'bees':20,'bis':20,'ikkis':21,'baais':22,'teis':23,'chaubis':24,'pachchis':25,'pachis':25,'chhabbis':26,'sattais':27,'atthais':28,'untis':29,'tees':30,'tis':30,'battis':32,'paintis':35,'chhattis':36,
    'chalis':40,'chaalis':40,'pachas':50,'pachaas':50,'pachpan':55,'saath':60,'sath':60,'painsath':65,'sattar':70,'pachattar':75,'assi':80,'pachasi':85,'nabbe':90,'nabbey':90,
    // English
    'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,'sixteen':16,'seventeen':17,'eighteen':18,'nineteen':19,
    'twenty':20,'thirty':30,'forty':40,'fifty':50,'sixty':60,'seventy':70,'eighty':80,'ninety':90
  };
  Object.keys(EXTRA).forEach(function (k) { SMALL[k] = EXTRA[k]; });
  // ambiguous words that are only numbers when next to another number word / unit
  var AMBIG = { 'दो': 2, 'do': 2, 'sau': 100, 'सौ': 100, 'ek': 1, 'एक': 1, 'sat': 7, 'tin': 3, 'tis': 30, 'bis': 20, 'ath': 8, 'che': 6, 'छे': 6, 'sath': 60, 'nau': 9, 'नौ': 9, 'bara': 12, 'tera': 13, 'das': 10, 'दस': 10 };
  var MULT = { 'सौ':100,'sau':100,'so':100,'hundred':100,'हजार':1000,'हज़ार':1000,'hazar':1000,'hazaar':1000,'hajar':1000,'hajaar':1000,'thousand':1000,'k':1000,
    'लाख':100000,'lakh':100000,'lac':100000,'lakhs':100000,'करोड':10000000,'crore':10000000,'karod':10000000 };
  var FRAC = { 'डेढ':1.5,'dedh':1.5,'derh':1.5,'ढाई':2.5,'dhai':2.5,'adhai':2.5,'अढाई':2.5 };
  var PREF = { 'साढे':0.5,'sadhe':0.5,'saadhe':0.5,'sade':0.5,'सवा':0.25,'sawa':0.25,'sava':0.25,'पौने':-0.25,'paune':-0.25 };
  var POINT = { 'point':1,'पॉइंट':1,'पॉइन्ट':1,'पोइंट':1,'प्वाइंट':1,'दशमलव':1,'डॉट':1,'dot':1 };
  var UNIT_WORDS = /^(बोरी|बोरा|बोरे|बोरियां|बैग|बैग्स|कट्टे|कट्टा|पैकेट|bori|bora|bore|boriya|bag|bags|katte|katta|packet|घंटे|घंटा|घण्टे|ghante|ghanta|hours?|hrs?|डिग्री|degree|degrees|लीटर|litre|liter|litres|ltr|l|रुपये|रुपए|रुपया|rupees?|rs|यूनिट|units?|परसेंट|percent|प्रतिशत|%|मिनट|minute|minutes|लॉट|lot)$/;

  function normalize(text) {
    var t = String(text || '');
    t = t.replace(/[०-९]/g, function (d) { return String(d.charCodeAt(0) - 0x0966); });
    t = t.replace(/\u093C/g, '').replace(/\u0901/g, '\u0902'); // nukta, chandrabindu
    t = t.replace(/(\d),(?=\d)/g, '$1');            // 20,000 -> 20000
    t = t.replace(/₹\s*/g, ' ₹ ');
    t = t.replace(/(\d)\s*°\s*c?/gi, '$1 डिग्री ');
    t = t.replace(/(\d)\s*%/g, '$1 % ');
    t = t.replace(/(\d)(k)\b/gi, '$1 k');           // 20k -> 20 k
    t = t.replace(/(\d)([a-z\u0900-\u097F])/gi, '$1 $2');
    t = t.replace(/([a-z\u0900-\u097F])(\d)/gi, '$1 $2');
    t = t.replace(/[,;:!?।|()"]+/g, ' ');
    t = t.replace(/(^|\s)\.|\.(\s|$)/g, ' ');
    return t.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function isNumTok(w) { return /^\d+(\.\d+)?$/.test(w); }
  function smallVal(w) { return Object.prototype.hasOwnProperty.call(SMALL, w) ? SMALL[w] : undefined; }

  // Convert number words in a token list into digit tokens.
  function wordsToDigits(tokens) {
    var out = [], i = 0;
    function isNumberish(w) {
      return w !== undefined && (isNumTok(w) || smallVal(w) !== undefined || MULT[w] || FRAC[w] || PREF[w]);
    }
    while (i < tokens.length) {
      var w = tokens[i];
      var startsNum = isNumTok(w) || smallVal(w) !== undefined || FRAC[w] !== undefined || PREF[w] !== undefined ||
        (MULT[w] && MULT[w] >= 100 && w !== 'k' && w !== 'so');
      if (startsNum && AMBIG[w] !== undefined && !isNumTok(w)) {
        var nx = tokens[i + 1];
        var prev = tokens[i - 1];
        var ok = (nx !== undefined && (isNumberish(nx) || UNIT_WORDS.test(nx) || POINT[nx])) ||
                 (prev !== undefined && /^(chamber|चेंबर|चैंबर|चेम्बर|कक्ष|lot|लॉट|लोट|लाट|meter|मीटर|नंबर|number|no)$/.test(prev));
        if (w === 'सौ' || w === 'sau') ok = true; // "सौ बोरी" = 100
        if ((w === 'दो' || w === 'do') && prev !== undefined && /^(दे|ले|कर|रख|de|le|kar|rakh|bata|बता)$/.test(prev) && !(nx && (MULT[nx] || UNIT_WORDS.test(nx)))) ok = false;
        if (!ok) { out.push(w); i++; continue; }
      }
      if (!startsNum) { out.push(w); i++; continue; }
      // accumulate a number phrase
      var total = 0, current = 0, have = false, pref = 0, j = i, lastWasMult = false, lastSmall = null;
      while (j < tokens.length) {
        var t = tokens[j];
        var sv = isNumTok(t) ? parseFloat(t) : smallVal(t);
        if (PREF[t] !== undefined) { if (have && !lastWasMult) break; pref = PREF[t]; j++; continue; }
        if (FRAC[t] !== undefined) { if (have && !lastWasMult) break; current = FRAC[t]; have = true; lastWasMult = false; lastSmall = current; j++; continue; }
        if (sv !== undefined) {
          if (have && !lastWasMult) {
            // "3 point 5" handled below; "बीस पांच" -> separate numbers, except "20 5" style compounds no
            break;
          }
          current = (lastWasMult ? current : 0) + sv + pref; pref = 0; have = true; lastWasMult = false; lastSmall = sv; j++;
          // decimal: X point Y
          if (POINT[tokens[j]] && tokens[j + 1] !== undefined) {
            var dv = isNumTok(tokens[j + 1]) ? tokens[j + 1] : (smallVal(tokens[j + 1]) !== undefined ? String(smallVal(tokens[j + 1])) : null);
            if (dv !== null && /^\d+$/.test(dv)) { current = parseFloat(String(Math.floor(current)) + '.' + dv); j += 2; }
          }
          continue;
        }
        if (MULT[t] !== undefined && (have || MULT[t] >= 100) && !(t === 'k' && !have) && !(t === 'so' && !have)) {
          var m = MULT[t];
          if (!have) { current = 1 + pref; pref = 0; have = true; }
          if (m === 100) { current = current * 100; lastWasMult = true; }
          else { total += current * m; current = 0; lastWasMult = true; }
          j++; continue;
        }
        break;
      }
      if (!have) { out.push(w); i++; continue; }
      var val = total + current;
      val = Math.round(val * 1000) / 1000;
      out.push(String(val));
      i = j;
    }
    return out;
  }

  // ---------- keyword sets ----------
  function re(list) { return new RegExp('^(' + list.join('|') + ')$'); }
  var K = {
    bags: re(['बोरी','बोरा','बोरे','बोरियां','बोरियों','बैग','बैग्स','कट्टे','कट्टा','कट्टों','पैकेट','पैकेट्स','bori','bora','bore','boriya','boriyan','bag','bags','katte','katta','packet','packets','पैक','बोरिया']),
    lot: re(['लॉट','लोट','लाट','लौट','lot','lot.','लट','रसीद','raseed','receipt']),
    chamber: re(['चेंबर','चैंबर','चेम्बर','चैम्बर','चेंबरों','कक्ष','कमरा','कमरे','chamber','chambar','chember','room','रूम']),
    stockIn: re(['आई','आए','आये','आया','आयी','आ','जमा','इन','in','aayi','aai','aaye','aaya','aae','aya','ayi','rakhi','rakhe','रखी','रखे','रखा','रखवाई','रखवाए','लोडिंग','उतरी','उतारी','उतारे','unloading','arrival','received','भरी','भरे','चढ़ी','dali','डाली','डाले','स्टोर']),
    stockOut: re(['निकली','निकाली','निकाले','निकला','निकाला','निकले','निकासी','निकलवाई','निकलवाए','डिलीवरी','उठी','उठाई','उठाए','उठे','आउट','out','nikli','nikali','nikale','nikla','nikasi','delivery','dispatch','डिस्पैच','भेजी','भेजे','उठान','gayi','gai','गई','गयी','गए','गये','lifting','लिफ्टिंग','उठवाई']),
    temp: re(['टेंपरेचर','टेम्परेचर','टेम्प्रेचर','टेंप्रेचर','तापमान','टेंप','टेम्प','डिग्री','temperature','temp','degree','degrees','तापमान','टेंपरेचर्स','सेल्सियस','celsius']),
    hum: re(['ह्यूमिडिटी','हुमिडिटी','ह्यूमिडिटि','नमी','आर्द्रता','आरएच','humidity','rh','%','परसेंट','प्रतिशत','percent','moisture','मॉइस्चर']),
    meter: re(['मीटर','meter','मीटर्स','रीडिंग','reading','readings','यूनिट','यूनिट्स','unit','units','kwh']),
    dg: re(['डीजी','dg','d.g.','जनरेटर','जेनरेटर','जनरेटर','generator','genset','जेनसेट','जेनसेट']),
    diesel: re(['डीजल','डीज़ल','diesel','डिजल','तेल','hsd']),
    litre: re(['लीटर','लिटर','litre','liter','litres','liters','ltr','l']),
    hours: re(['घंटे','घंटा','घण्टे','घण्टा','ghante','ghanta','ghante','hour','hours','hrs','hr']),
    minutes: re(['मिनट','minute','minutes','min','mins']),
    power: re(['बिजली','लाइट','light','bijli','बिजलि','पावर','power','करंट','current','सप्लाई','supply','कट','cut','कटौती']),
    money: re(['रुपये','रुपए','रुपया','रूपए','रूपये','रु','₹','rs','rupees','rupee','rupaye','rupay','rupaiye']),
    received: re(['मिले','मिला','मिली','mile','mila','mili','प्राप्त','received','receive','जमा','आए','आये','aaye','aaya','आया']),
    rent: re(['किराया','किराए','किराये','भाड़ा','भाडा','kiraya','kiraye','kiraaya','bhada','rent','भंडारण','storage']),
    udhar: re(['उधार','udhar','udhaar','उधारी','एडवांस','advance','कर्ज','कर्जा','loan','लोन','उधर']),
    expense: re(['खर्च','खर्चा','खर्चे','kharch','kharcha','kharche','expense','expenses','बिल','bill','खरीदा','खरीदी','खरीदे','kharida','kharidi','मजदूरी','मज़दूरी','majduri','mazdoori','सैलरी','salary','तनख्वाह','वेतन','पगार','मरम्मत','repair','रिपेयर','चाय','भुगतान','payment','पेमेंट']),
    gave: re(['दिए','दिये','दिया','दी','diye','diya','di','dia','de','dena','dene','देना','देने','दिये','दे','पेमेंट','payment','भेजे','भेजा','bheje','चुकाए','चुकाया','paid','pay']),
    mode: re(['कैश','नकद','cash','naqad','nakad','ऑनलाइन','online','upi','यूपीआई','gpay','गूगल','phonepe','फोनपे','paytm','पेटीएम','चेक','cheque','check','बैंक','bank','neft','rtgs','imps','ट्रांसफर','transfer']),
    particle: re(['की','के','का','से','को','ने','ki','ke','ka','se','ko','ne','वाले','wale','waale']),
    filler: re(['आज','अभी','कल','सुबह','शाम','रात','दोपहर','aaj','abhi','kal','subah','sham','shaam','raat','entry','एंट्री','लिखो','likho','नोट','note','करो','karo','भाई','bhai','श्री','shri','मिस्टर','mr','हां','haan','ok','ओके','तो','to'])
  };
  var VARIETIES = [
    [/3797|तीन हजार सात सौ सत्तानवे/, '3797'], [/chipsona|चिपसोना/, 'Chipsona'], [/pukhraj|पुखराज/, 'Pukhraj'], [/khyati|ख्याति/, 'Khyati'],
    [/bahar|बहार/, 'Bahar'], [/kufri|कुफरी/, 'Kufri'], [/diamond|डायमंड/, 'Diamond'], [/lr\b|lady rosetta|लेडी/, 'LR'], [/surya|सूर्या/, 'Surya'],
    [/sugar ?free|शुगर फ्री/, 'Sugar Free'], [/mohan|मोहन/, 'Mohan'], [/kesar|केसर/, 'Kesar'], [/lal aloo|लाल आलू|लाल/, 'Lal'], [/badshah|बादशाह/, 'Badshah'], [/जवाहर|jawahar/, 'Jawahar'], [/सफेद|safed/, 'Safed']
  ];

  function idxAll(tokens, rx) { var r = []; tokens.forEach(function (t, i) { if (rx.test(t)) r.push(i); }); return r; }
  function has(tokens, rx) { return tokens.some(function (t) { return rx.test(t); }); }
  // nearest number to any keyword index; prefer after within window, else before
  function numNear(tokens, kidx, opts) {
    opts = opts || {}; var win = opts.win || 3; var used = opts.used || {};
    var best = null;
    kidx.forEach(function (k) {
      for (var d = 1; d <= win; d++) {
        var cands = opts.prefer === 'before' ? [k - d, k + d] : [k + d, k - d];
        for (var c = 0; c < cands.length; c++) {
          var p = cands[c];
          if (p >= 0 && p < tokens.length && isNumTok(tokens[p]) && !used[p]) {
            var score = d + (c === 1 ? 0.5 : 0);
            if (!best || score < best.score) best = { idx: p, val: parseFloat(tokens[p]), score: score };
          }
        }
      }
    });
    return best;
  }
  function numBeforeUnit(tokens, rx, used) {
    for (var i = 1; i < tokens.length; i++) if (rx.test(tokens[i]) && isNumTok(tokens[i - 1]) && !(used && used[i - 1])) return { idx: i - 1, val: parseFloat(tokens[i - 1]) };
    return null;
  }

  var STOP_NAME = function (t) {
    return isNumTok(t) || K.bags.test(t) || K.lot.test(t) || K.chamber.test(t) || K.stockIn.test(t) || K.stockOut.test(t) ||
      K.money.test(t) || K.received.test(t) || K.gave.test(t) || K.rent.test(t) || K.udhar.test(t) || K.mode.test(t) || MULT[t];
  };
  function extractName(tokens, opts) {
    opts = opts || {};
    // 1) words immediately before a particle (की/के/का/से/को)
    for (var i = 0; i < tokens.length; i++) {
      if (K.particle.test(tokens[i]) && i > 0) {
        var j = i - 1, words = [];
        while (j >= 0 && words.length < 4 && !STOP_NAME(tokens[j]) && !K.particle.test(tokens[j]) && !K.filler.test(tokens[j])) { words.unshift(tokens[j]); j--; }
        while (words.length && /^(में|मे|mein|me|पर|par)$/.test(words[words.length - 1])) words.pop();
        if (words.length && !(words.length === 1 && /^(उस|इस|उन|इन|us|is|un|in|मेरे|mere|हमारे|किसान|kisan|सब|sab)$/.test(words[0]))) return titleCase(words.join(' '));
      }
    }
    // 2) "X ji" pattern
    for (var k = 1; k < tokens.length; k++) if (/^(जी|ji)$/.test(tokens[k])) return titleCase(tokens.slice(Math.max(0, k - 2), k + 1).filter(function (t) { return !STOP_NAME(t) && !K.filler.test(t); }).join(' '));
    // 3) leading non-keyword words
    if (opts.leading) {
      var w = [];
      for (var m = 0; m < tokens.length && w.length < 3; m++) {
        if (K.filler.test(tokens[m]) && !w.length) continue;
        if (STOP_NAME(tokens[m]) || K.particle.test(tokens[m]) || /^(में|मे|mein|me|main|पर|par|लिए|liye|हेतु|का|के|की)$/.test(tokens[m])) break;
        w.push(tokens[m]);
      }
      if (w.length) return titleCase(w.join(' '));
    }
    return '';
  }
  function titleCase(s) { return s.replace(/\b([a-z])/g, function (c) { return c.toUpperCase(); }); }

  // ---------- main ----------
  function parse(raw, forceType) {
    var norm = normalize(raw);
    var tokens = wordsToDigits(norm.split(' ').filter(Boolean));
    var text = tokens.join(' ');
    var nums = tokens.filter(isNumTok);
    var s = { 'Stock': 0, 'Chamber Readings': 0, 'Power': 0, 'Payments': 0 };

    var hasBags = has(tokens, K.bags), hasLot = has(tokens, K.lot), hasCh = has(tokens, K.chamber);
    var hasTemp = has(tokens, K.temp), hasHum = has(tokens, K.hum);
    var hasMeter = has(tokens, K.meter), hasDG = has(tokens, K.dg), hasDiesel = has(tokens, K.diesel), hasPower = has(tokens, K.power);
    var hasMoney = has(tokens, K.money) || /(^| )(\d+ )?(हजार|लाख|hazar|hajar|lakh)( |$)/.test(norm);
    var hasRent = has(tokens, K.rent), hasUdhar = has(tokens, K.udhar), hasExp = has(tokens, K.expense);
    var hasRecv = has(tokens, K.received), hasGave = has(tokens, K.gave);
    var big = nums.some(function (n) { return parseFloat(n) >= 1000; });

    if (hasBags) s['Stock'] += 3;
    if (hasLot) s['Stock'] += 2;
    if (hasCh && (hasBags || hasLot)) s['Stock'] += 1;
    if (hasTemp) s['Chamber Readings'] += 3;
    if (hasHum) s['Chamber Readings'] += 2;
    if (hasCh && !hasBags && !hasLot && nums.length) s['Chamber Readings'] += 1;
    if (hasMeter) s['Power'] += 3;
    if (hasDG) s['Power'] += 3;
    if (hasDiesel) s['Power'] += 2;
    if (hasPower && (has(tokens, K.hours) || has(tokens, K.minutes) || has(tokens, K.stockOut) || /कट|cut|गई|गयी|gayi|gai/.test(text))) s['Power'] += 3;
    if (hasMoney) s['Payments'] += 3;
    if (hasRent) s['Payments'] += 2;
    if (hasUdhar) s['Payments'] += 3;
    if (hasExp) s['Payments'] += 2;
    if ((hasRecv || hasGave) && big && !hasMeter) s['Payments'] += 2;
    if (has(tokens, K.mode)) s['Payments'] += 2;
    if ((hasRecv || hasGave) && nums.length && has(tokens, /^(को|से|ko|se)$/)) s['Payments'] += 2;
    if (hasBags && hasRent && hasMoney) s['Stock'] -= 2; // "200 bori ka kiraya 20000 mila" -> payment
    if (hasDiesel && hasMoney && !has(tokens, K.litre)) { s['Payments'] += 2; } // "diesel 5000 rupaye ka liya" -> expense

    var type = 'Notes', bestScore = 1;
    ['Stock', 'Chamber Readings', 'Power', 'Payments'].forEach(function (k) { if (s[k] > bestScore) { bestScore = s[k]; type = k; } });
    if (!nums.length && type !== 'Notes' && type !== 'Power') type = 'Notes';

    if (forceType && FIELDS[forceType]) type = forceType;
    var f = {}, used = {};
    if (type === 'Stock') {
      var outScore = idxAll(tokens, K.stockOut).length, inScore = idxAll(tokens, K.stockIn).length;
      f['In/Out'] = outScore > inScore ? 'OUT' : (inScore ? 'IN' : '');
      var b = numBeforeUnit(tokens, K.bags) || numNear(tokens, idxAll(tokens, K.bags), { win: 2, prefer: 'before' });
      var l = numNear(tokens, idxAll(tokens, K.lot), { win: 2 });
      if (l) used[l.idx] = 1;
      var c = numNear(tokens, idxAll(tokens, K.chamber), { win: 2, used: used });
      if (c) used[c.idx] = 1;
      if (b && used[b.idx]) b = null;
      if (!b) { for (var q = 0; q < tokens.length; q++) if (isNumTok(tokens[q]) && !used[q]) { b = { idx: q, val: parseFloat(tokens[q]) }; break; } }
      f['Farmer/Party'] = extractName(tokens, { leading: true });
      f['Bags'] = b ? b.val : '';
      f['Lot No'] = l ? l.val : '';
      f['Chamber'] = c ? c.val : '';
      var v = ''; VARIETIES.forEach(function (p) { if (!v && p[0].test(norm)) v = p[1]; });
      if (v === '3797' && String(f['Lot No']) === '3797') v = '';
      f['Variety'] = v;
    } else if (type === 'Chamber Readings') {
      var ch = numNear(tokens, idxAll(tokens, K.chamber), { win: 2 });
      if (ch) used[ch.idx] = 1;
      var degIdx = idxAll(tokens, /^(डिग्री|degree|degrees|सेल्सियस|celsius)$/);
      var tp = null;
      if (degIdx.length) tp = numNear(tokens, degIdx, { win: 1, prefer: 'before', used: used });
      if (!tp) tp = numNear(tokens, idxAll(tokens, K.temp), { win: 3, used: used });
      if (tp) used[tp.idx] = 1;
      var hm = numNear(tokens, idxAll(tokens, /^(%|परसेंट|प्रतिशत|percent)$/), { win: 1, prefer: 'before', used: used }) ||
               numNear(tokens, idxAll(tokens, K.hum), { win: 3, used: used });
      if (hm) used[hm.idx] = 1;
      // fallback: unlabelled numbers -> temp (<=20) / humidity (50-100)
      tokens.forEach(function (t, i) {
        if (!isNumTok(t) || used[i]) return; var n = parseFloat(t);
        if (!tp && n <= 20) { tp = { val: n }; used[i] = 1; } else if (!hm && n >= 50 && n <= 100) { hm = { val: n }; used[i] = 1; }
      });
      var neg = tp && tp.idx !== undefined && /^(माइनस|minus|-)$/.test(tokens[tp.idx - 1] || '');
      f['Chamber'] = ch ? ch.val : '';
      f['Temperature (°C)'] = tp ? (neg ? -tp.val : tp.val) : '';
      f['Humidity (%)'] = hm ? hm.val : '';
    } else if (type === 'Power') {
      var mIdx = idxAll(tokens, /^(मीटर|meter|मीटर्स)$/), rIdx = idxAll(tokens, /^(रीडिंग|reading|readings|यूनिट|यूनिट्स|unit|units|kwh)$/);
      var reading = null, mno = null;
      // biggest number near meter/reading words = reading; small number right after "meter" = meter no
      var cand = [];
      mIdx.concat(rIdx).forEach(function (k) { for (var d = -3; d <= 4; d++) { var p = k + d; if (p >= 0 && p < tokens.length && isNumTok(tokens[p])) cand.push(p); } });
      cand = cand.filter(function (p, i, a) { return a.indexOf(p) === i; });
      if (cand.length) {
        cand.sort(function (a, z) { return parseFloat(tokens[z]) - parseFloat(tokens[a]); });
        if (rIdx.length || parseFloat(tokens[cand[0]]) >= 10) { reading = { idx: cand[0], val: parseFloat(tokens[cand[0]]) }; used[cand[0]] = 1; }
      }
      mIdx.forEach(function (k) { var p = k + 1; if (!mno && isNumTok(tokens[p] || '') && !used[p] && parseFloat(tokens[p]) < 10) { mno = { val: parseFloat(tokens[p]) }; used[p] = 1; } });
      if (!mno) mIdx.forEach(function (k) { if (/^(नंबर|number|no)$/.test(tokens[k + 1] || '') && isNumTok(tokens[k + 2] || '') && !used[k + 2]) { mno = { val: parseFloat(tokens[k + 2]) }; used[k + 2] = 1; } });
      // diesel litres
      var dl = numBeforeUnit(tokens, K.litre, used);
      if (!dl && hasDiesel) dl = numNear(tokens, idxAll(tokens, K.diesel), { win: 2, used: used });
      if (dl) used[dl.idx] = 1;
      // hours: assign each "N ghante" to nearest DG or power keyword
      var dgH = '', cutH = '';
      var dgI = idxAll(tokens, K.dg), pwI = idxAll(tokens, /^(बिजली|लाइट|light|bijli|बिजलि|पावर|power|करंट|current|सप्लाई|supply|कट|cut|कटौती)$/);
      for (var h = 1; h < tokens.length; h++) {
        var isH = K.hours.test(tokens[h]), isM = K.minutes.test(tokens[h]);
        if ((isH || isM) && isNumTok(tokens[h - 1]) && !used[h - 1]) {
          var val = parseFloat(tokens[h - 1]);
          if (isM) val = Math.round(val / 60 * 100) / 100;
          // "4 घंटे 30 मिनट" -> add minutes
          if (isH && isNumTok(tokens[h + 1] || '') && K.minutes.test(tokens[h + 2] || '')) { val += Math.round(parseFloat(tokens[h + 1]) / 60 * 100) / 100; used[h + 1] = 1; }
          used[h - 1] = 1;
          var nI = h - 1, lastDg = -1, lastPw = -1;
          dgI.forEach(function (x) { if (x < nI && x > lastDg) lastDg = x; });
          pwI.forEach(function (x) { if (x < nI && x > lastPw) lastPw = x; });
          var goDg;
          if (lastDg >= 0 || lastPw >= 0) goDg = lastDg > lastPw;
          else {
            var dDg = dgI.length ? Math.min.apply(null, dgI.map(function (x) { return Math.abs(x - h); })) : 99;
            var dPw = pwI.length ? Math.min.apply(null, pwI.map(function (x) { return Math.abs(x - h); })) : 99;
            goDg = dgI.length ? dDg <= dPw : (pwI.length ? false : true);
          }
          if (goDg) { if (dgH === '') dgH = val; } else { if (cutH === '') cutH = val; }
        }
      }
      if (dgH === '' && dgI.length) { var dn = numNear(tokens, dgI, { win: 2, used: used }); if (dn && dn.val <= 24) { dgH = dn.val; used[dn.idx] = 1; } }
      f['Meter No'] = mno ? mno.val : '';
      f['Meter Reading'] = reading ? reading.val : '';
      f['DG Hours'] = dgH;
      f['Diesel (L)'] = dl ? dl.val : '';
      f['Power Cut (hrs)'] = cutH;
    } else if (type === 'Payments') {
      var amt = null;
      tokens.forEach(function (t, i) {
        if (!isNumTok(t)) return; var n = parseFloat(t);
        var nearMoney = K.money.test(tokens[i + 1] || '') || K.money.test(tokens[i - 1] || '');
        var sc = n + (nearMoney ? 1e12 : 0);
        if (!amt || sc > amt.sc) amt = { val: n, sc: sc };
      });
      var ptype;
      if (hasRent) ptype = 'Rent Received';
      else if (hasUdhar) ptype = 'Udhar Given';
      else if (hasExp && !(has(tokens, /^(मिले|मिला|मिली|mile|mila|mili|received)$/))) ptype = 'Expense';
      else if (has(tokens, /^(मिले|मिला|मिली|mile|mila|mili|प्राप्त|received|receive|जमा|आए|आये|आया|aaye|aaya)$/) || has(tokens, /^(से|se)$/)) ptype = 'Received';
      else if (hasGave) ptype = 'Paid';
      else ptype = 'Received';
      if (hasRent && hasGave && !has(tokens, /^(मिले|मिला|मिली|mile|mila|mili|received|जमा)$/) && has(tokens, /^(को|ko)$/)) ptype = 'Rent Paid';
      if (hasUdhar && has(tokens, /^(मिले|मिला|मिली|mile|mila|mili|वापस|wapas|lautaya|लौटाए|लौटाया)$/)) ptype = 'Udhar Returned';
      var modeW = tokens.filter(function (t) { return K.mode.test(t); })[0] || '';
      var modeMap = { 'कैश':'Cash','नकद':'Cash','cash':'Cash','naqad':'Cash','nakad':'Cash','ऑनलाइन':'Online','online':'Online','upi':'UPI','यूपीआई':'UPI','gpay':'UPI','गूगल':'UPI','phonepe':'UPI','फोनपे':'UPI','paytm':'UPI','पेटीएम':'UPI','चेक':'Cheque','cheque':'Cheque','check':'Cheque','बैंक':'Bank','bank':'Bank','neft':'Bank','rtgs':'Bank','imps':'Bank','ट्रांसफर':'Bank','transfer':'Bank' };
      f['Type'] = ptype;
      f['Party'] = extractName(tokens, { leading: true });
      f['Amount (₹)'] = amt ? amt.val : '';
      f['Mode'] = modeMap[modeW] || '';
    } else {
      f['Note'] = String(raw || '').trim();
    }
    return { type: type, fields: f, normalized: text, scores: s };
  }

  function summary(p) {
    var f = p.fields;
    switch (p.type) {
      case 'Stock': return (f['Farmer/Party'] || 'किसान') + ' — ' + (f['Bags'] || '?') + ' बोरी ' + (f['In/Out'] === 'OUT' ? 'निकासी' : 'आवक') + (f['Lot No'] !== '' ? ', लॉट ' + f['Lot No'] : '') + (f['Chamber'] !== '' ? ', चेंबर ' + f['Chamber'] : '');
      case 'Chamber Readings': return 'चेंबर ' + (f['Chamber'] !== '' ? f['Chamber'] : '?') + (f['Temperature (°C)'] !== '' ? ', तापमान ' + f['Temperature (°C)'] + ' डिग्री' : '') + (f['Humidity (%)'] !== '' ? ', नमी ' + f['Humidity (%)'] + ' प्रतिशत' : '');
      case 'Power': var a = []; if (f['Meter Reading'] !== '') a.push('मीटर ' + (f['Meter No'] !== '' ? f['Meter No'] + ' ' : '') + 'रीडिंग ' + f['Meter Reading']); if (f['DG Hours'] !== '') a.push('डीजी ' + f['DG Hours'] + ' घंटे'); if (f['Diesel (L)'] !== '') a.push('डीजल ' + f['Diesel (L)'] + ' लीटर'); if (f['Power Cut (hrs)'] !== '') a.push('बिजली कटौती ' + f['Power Cut (hrs)'] + ' घंटे'); return a.join(', ') || 'बिजली एंट्री';
      case 'Payments': var tmap = { 'Rent Received': 'किराया मिला', 'Udhar Given': 'उधार दिया', 'Udhar Returned': 'उधार वापस मिला', 'Expense': 'खर्च', 'Received': 'पैसे मिले', 'Paid': 'भुगतान किया', 'Rent Paid': 'किराया दिया' };
        return (tmap[f['Type']] || f['Type']) + ' — ' + (f['Party'] ? f['Party'] + ', ' : '') + '₹' + (f['Amount (₹)'] !== '' ? f['Amount (₹)'] : '?');
      default: return 'नोट सेव';
    }
  }

  var api = { parse: parse, normalize: normalize, wordsToDigits: wordsToDigits, HEADERS: HEADERS, FIELDS: FIELDS, summary: summary };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CSParser = api;
})(typeof window !== 'undefined' ? window : this);
