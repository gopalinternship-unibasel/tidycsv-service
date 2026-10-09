(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TidyCSV = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function parse(text, delimiter = ',') {
    if (!text || !text.replace(/^\uFEFF/, '').trim()) throw new Error('This file is empty.');
    text = text.replace(/^\uFEFF/, '');
    const rows = []; let row = [], field = '', state = 'plain', touched = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i]; touched = true;
      if (state === 'quoted') {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else state = 'closed'; }
        else field += c;
        continue;
      }
      if (c === delimiter) { row.push(field); field = ''; state = 'plain'; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = ''; state = 'plain'; touched = false;
      } else if (c === '"') {
        if (state !== 'plain' || field.length) throw new Error('Unexpected quote in CSV record ' + (rows.length + 1) + '.');
        state = 'quoted';
      } else {
        if (state === 'closed') {
          if (c === ' ' || c === '\t') continue;
          throw new Error('Unexpected character after a closing quote in CSV record ' + (rows.length + 1) + '.');
        }
        field += c;
      }
    }
    if (state === 'quoted') throw new Error('Unclosed quote in CSV record ' + (rows.length + 1) + '.');
    if (touched || field.length || row.length) { row.push(field); rows.push(row); }
    return rows;
  }
  function detectDelimiter(text) {
    const candidates = [',', ';', '\t', '|'];
    const counts = candidates.map(() => []); let current = candidates.map(() => 0), quote = false, records = 0;
    for (let i = 0; i < text.length && records < 20; i++) {
      const c = text[i];
      if (c === '"') { if (quote && text[i + 1] === '"') { i++; continue; } quote = !quote; }
      if (quote) continue;
      candidates.forEach((d, n) => { if (d === c) current[n]++; });
      if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        counts.forEach((a, n) => a.push(current[n])); current = candidates.map(() => 0); records++;
      }
    }
    if (current.some(Boolean)) counts.forEach((a, n) => a.push(current[n]));
    let best = 0, score = 0;
    counts.forEach((a, n) => {
      const positive = a.filter(v => v > 0); if (!positive.length) return;
      const frequencies = new Map(); positive.forEach(v => frequencies.set(v, (frequencies.get(v) || 0) + 1));
      const mode = [...frequencies].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
      const s = mode[1] / Math.max(1, a.length) * 100 + Math.min(mode[0], 50);
      if (s > score) { score = s; best = n; }
    });
    return candidates[best];
  }
  function dataset(text, name, options = {}) {
    const delimiter = options.delimiter || detectDelimiter(text);
    const rows = parse(text, delimiter), width = Math.max(...rows.slice(0, 1).map(r => r.length));
    const used = new Set(), warnings = [];
    const rawHeaders = options.hasHeader === false ? Array.from({ length: width }, (_, i) => 'Column ' + (i + 1)) : rows.shift();
    const headers = rawHeaders.map((h, i) => {
      const base = h.trim() || 'Column ' + (i + 1); let result = base, n = 2;
      while (used.has(result)) result = base + ' (' + n++ + ')';
      if (result !== h) warnings.push('Column ' + (i + 1) + ': header ' + JSON.stringify(h) + ' becomes ' + JSON.stringify(result) + '.');
      used.add(result); return result;
    });
    const records = rows.map((values, i) => {
      const record = i + (options.hasHeader === false ? 1 : 2);
      if (values.length === 1 && values[0].trim() === '') values = Array(headers.length).fill('');
      if (values.length !== headers.length) throw new Error(name + ': CSV record ' + record + ' has ' + values.length + ' fields; expected ' + headers.length + '. Correct the file or delimiter before continuing.');
      return { values, source: name, record };
    });
    return { name, delimiter, headers, records, warnings };
  }
  function clean(datasets, options = {}) {
    if (!datasets.length) throw new Error('Add a CSV file or load the sample first.');
    const headers = [...new Set(datasets.flatMap(d => d.headers))];
    const audit = [], rows = [], warnings = datasets.flatMap(d => d.warnings), seen = new Map();
    let changedCells = 0, removedRows = 0, blankKeys = 0;
    const keyHeaders = options.dedupe === 'all' ? headers : (Array.isArray(options.dedupe) ? options.dedupe : []);
    const keyIndices = keyHeaders.map(h => headers.indexOf(h));
    if (keyIndices.some(i => i < 0)) throw new Error('A selected duplicate key is missing from these files.');
    for (const data of datasets) for (const record of data.records) {
      const original = headers.map(h => { const i = data.headers.indexOf(h); return i < 0 ? '' : record.values[i]; });
      const values = original.map((value, i) => {
        let result = value;
        if (options.trim) result = result.trim();
        if (options.emailLower && /(^|[\s_-])e?mail([\s_-]|$)/i.test(headers[i])) result = result.toLowerCase();
        if (result !== value) { changedCells++; audit.push({ source: record.source, record: record.record, action: 'cell changed', column: headers[i], before: value, after: result, reason: 'Selected cleanup rules' }); }
        return result;
      });
      if (options.removeBlank && values.every(v => !v.trim())) {
        removedRows++; audit.push({ source: record.source, record: record.record, action: 'row removed', column: '', before: JSON.stringify(original), after: '', reason: 'Blank row' }); continue;
      }
      if (keyIndices.length) {
        const keyValues = keyIndices.map(i => options.ignoreCase ? values[i].toLowerCase() : values[i]);
        if (keyValues.every(v => !v.trim())) blankKeys++;
        else {
          const key = JSON.stringify(keyValues);
          if (seen.has(key)) {
            const first = seen.get(key); removedRows++;
            audit.push({ source: record.source, record: record.record, action: 'row removed', column: keyHeaders.join(' + '), before: JSON.stringify(original), after: '', reason: 'Duplicate; kept ' + first.source + ' record ' + first.record }); continue;
          }
          seen.set(key, record);
        }
      }
      rows.push({ values, source: record.source, record: record.record });
    }
    if (blankKeys) warnings.push(blankKeys + ' rows have an entirely blank duplicate key and were kept.');
    const formulaCells = rows.reduce((n, r) => n + r.values.filter(isFormulaLike).length, 0);
    if (formulaCells) warnings.push(formulaCells + ' cells start with spreadsheet formula characters. Export protection is recommended and may also prefix negative numbers.');
    const emailIndices = headers.map((h, i) => /(^|[\s_-])e?mail([\s_-]|$)/i.test(h) ? i : -1).filter(i => i >= 0);
    const emailWarnings = rows.reduce((n, r) => n + emailIndices.filter(i => r.values[i] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.values[i])).length, 0);
    if (emailWarnings) warnings.push(emailWarnings + ' nonempty email cells failed a basic format check. Review them; no email deliverability check was performed.');
    return { headers, rows, audit, warnings, stats: { inputRows: datasets.reduce((n, d) => n + d.records.length, 0), outputRows: rows.length, changedCells, removedRows, formulaCells, files: datasets.length } };
  }
  function isFormulaLike(value) { return /^[\s\u0000-\u001f]*[=+@-]/.test(String(value)); }
  function serialize(rows, options = {}) {
    const delimiter = options.delimiter || ',', protect = options.protect !== false;
    return (options.bom ? '\uFEFF' : '') + rows.map(row => row.map(value => {
      let v = String(value == null ? '' : value);
      if (protect && isFormulaLike(v)) v = "'" + v;
      return v.includes(delimiter) || /["\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(delimiter)).join('\r\n') + '\r\n';
  }
  function project(result, columns) {
    const selected = columns.filter(c => c.include !== false);
    if (!selected.length) throw new Error('Select at least one column to export.');
    const labels = selected.map(c => c.label.trim());
    if (labels.some(h => !h) || new Set(labels).size !== labels.length) throw new Error('Export column names must be nonempty and unique.');
    return [labels, ...result.rows.map(r => selected.map(c => r.values[result.headers.indexOf(c.source)]))];
  }
  return { parse, detectDelimiter, dataset, clean, serialize, project, isFormulaLike };
});
