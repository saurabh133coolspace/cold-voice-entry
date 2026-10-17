/**
 * Cool Space Voice Entries — Google Apps Script web app (free).
 * Receives entries from the voice page and appends them to the right tab.
 * Paste this whole file into Extensions > Apps Script of the
 * "Cool Space Voice Entries" sheet, then Deploy > New deployment > Web app.
 */
// Leave empty when the script is created from the Sheet (Extensions > Apps Script).
var SHEET_ID = '';

var HEADERS = {
  'Stock': ['Timestamp', 'Date', 'In/Out', 'Farmer/Party', 'Bags', 'Lot No', 'Chamber', 'Variety', 'Entered By', 'Raw Transcript', 'Entry ID'],
  'Chamber Readings': ['Timestamp', 'Date', 'Chamber', 'Temperature (°C)', 'Humidity (%)', 'Entered By', 'Raw Transcript', 'Entry ID'],
  'Power': ['Timestamp', 'Date', 'Meter No', 'Meter Reading', 'DG Hours', 'Diesel (L)', 'Power Cut (hrs)', 'Entered By', 'Raw Transcript', 'Entry ID'],
  'Payments': ['Timestamp', 'Date', 'Type', 'Party', 'Amount (₹)', 'Mode', 'Entered By', 'Raw Transcript', 'Entry ID'],
  'Notes': ['Timestamp', 'Date', 'Note', 'Entered By', 'Raw Transcript', 'Entry ID']
};

function ss_() {
  return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function tab_(name) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    var h = HEADERS[name] || ['Timestamp', 'Date', 'Data', 'Entered By', 'Raw Transcript', 'Entry ID'];
    sh.appendRow(h);
    sh.getRange(1, 1, 1, h.length).setFontWeight('bold').setBackground('#e8f0fe');
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function saveOne_(e) {
  var name = HEADERS[e.tab] ? e.tab : 'Notes';
  var sh = tab_(name);
  var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var idCol = header.indexOf('Entry ID') + 1;
  // de-duplicate (the page may retry)
  if (idCol > 0 && e.id && sh.getLastRow() > 1) {
    var start = Math.max(2, sh.getLastRow() - 500);
    var ids = sh.getRange(start, idCol, sh.getLastRow() - start + 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(e.id)) return { id: e.id, status: 'duplicate' };
  }
  var now = new Date();
  var tz = 'Asia/Kolkata';
  var data = e.fields || {};
  if (name === 'Notes' && !data['Note']) data['Note'] = e.raw || '';
  data['Timestamp'] = e.ts || Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm:ss');
  data['Date'] = (data['Timestamp'] || '').slice(0, 10) || Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  data['Entered By'] = e.by || '';
  data['Raw Transcript'] = e.raw || '';
  data['Entry ID'] = e.id || '';
  // add any unknown field as a new column
  Object.keys(data).forEach(function (k) {
    if (header.indexOf(k) < 0) { header.push(k); sh.getRange(1, header.length).setValue(k).setFontWeight('bold'); }
  });
  var row = header.map(function (h) { var v = data[h]; return v === undefined || v === null ? '' : v; });
  sh.appendRow(row);
  return { id: e.id, status: 'saved', tab: name, row: sh.getLastRow() };
}

function doPost(req) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse(req.postData.contents);
    var list = body.entries || [body];
    var results = list.map(saveOne_);
    return json_({ ok: true, results: results });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(req) {
  var p = (req && req.parameter) || {};
  if (p.action === 'recent') {
    var out = {};
    Object.keys(HEADERS).forEach(function (n) {
      var sh = ss_().getSheetByName(n);
      if (!sh || sh.getLastRow() < 2) { out[n] = []; return; }
      var last = sh.getLastRow(), cnt = Math.min(5, last - 1);
      out[n] = sh.getRange(last - cnt + 1, 1, cnt, sh.getLastColumn()).getDisplayValues();
    });
    return json_({ ok: true, recent: out });
  }
  return json_({ ok: true, app: 'Cool Space Voice Entries', sheet: ss_().getName() });
}

/** Optional: run once from the editor to create any missing tabs/headers. */
function setup() {
  Object.keys(HEADERS).forEach(tab_);
}
