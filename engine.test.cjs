const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.cjs');
test('quoted commas, escaped quotes, multiline cells and CRLF', () => assert.deepEqual(E.parse('a,b\r\n"two,parts","say ""hi""\nagain"\r\n'), [['a','b'], ['two,parts','say "hi"\nagain']]));
test('BOM and trailing separator are retained correctly', () => assert.deepEqual(E.parse('\uFEFFa,b,\nx,y,\n'), [['a','b',''],['x','y','']]));
test('invalid quoting rejects incomplete data', () => { assert.throws(() => E.parse('a\n"unfinished'), /Unclosed/); assert.throws(() => E.parse('a\n"closed"oops'), /Unexpected/); assert.throws(() => E.parse('a\npre"quote'), /Unexpected/); });
test('auto detects semicolon, tab and pipe despite quoted commas', () => [';','\t','|'].forEach(d => assert.equal(E.detectDelimiter('name'+d+'note\nAda'+d+'"a,b,c"\nLin'+d+'"d,e,f"'), d)));
test('nonrectangular rows reject instead of truncating data', () => assert.throws(() => E.dataset('a,b\nx,y,z', 'bad.csv'), /expected 2/));
test('duplicate headers receive unique noncolliding labels', () => assert.deepEqual(E.dataset('email,email,email (2)\na,b,c', 'x').headers, ['email','email (2)','email (2) (2)']));
test('trim and dedupe are explicit; identifiers retain leading zeros', () => {
  const d = E.dataset('email,id\n ADA@example.com ,00124\nada@example.com,00124\n,00125\n,00126\n,\n', 'x.csv');
  const r = E.clean([d], { trim:true, emailLower:true, removeBlank:true, dedupe:['email'] });
  assert.equal(r.stats.outputRows,3); assert.equal(r.stats.removedRows,2); assert.equal(r.rows[0].values[1],'00124'); assert.match(r.warnings[0], /2 rows/); assert.ok(r.audit.some(a => a.reason.includes('kept x.csv record 2')));
});
test('merges schemas by exact column name and fills absent values', () => {
  const r = E.clean([E.dataset('id,name\n001,Ada','one'),E.dataset('name,note\nLin,Hi','two')]);
  assert.deepEqual(r.headers,['id','name','note']); assert.deepEqual(r.rows.map(r=>r.values),[['001','Ada',''],['','Lin','Hi']]);
});
test('deduplication keeps blank keys and keeps first matching key', () => {
  const r = E.clean([E.dataset('key,note\n,one\n,two\na,first\nA,second','x')],{dedupe:['key'],ignoreCase:true});
  assert.equal(r.rows.length,3); assert.equal(r.rows[2].values[1],'first');
});
test('export projection renames, reorders and omits columns', () => {
  const r = E.clean([E.dataset('a,b\nx,y','x')]);
  assert.deepEqual(E.project(r,[{source:'b',label:'renamed',include:true},{source:'a',label:'a',include:false}]),[['renamed'],['y']]);
  assert.throws(()=>E.project(r,[{source:'a',label:'',include:true}]),/nonempty/);
});
test('export protection prefixes formula-like cells including whitespace', () => {
  const rows = [['value'],['=1+1'],[' +CMD'],['-12'],['@SUM'],['safe']];
  assert.deepEqual(E.parse(E.serialize(rows)),[['value'],["'=1+1"],["' +CMD"],["'-12"],["'@SUM"],['safe']]);
  assert.deepEqual(E.parse(E.serialize(rows,{protect:false})),rows);
});
test('CSV round trips unusual but valid text losslessly without protection', () => {
  const rows = [['ID','note','value'],['0001','é\n東京','a,b'],['0002','"quoted"','\t=example'],['0003','', 'last']];
  [',',';','\t','|'].forEach(delimiter => assert.deepEqual(E.parse(E.serialize(rows,{delimiter,protect:false,bom:true}),delimiter),rows));
});
test('no-header mode retains first data row and rejects empty input', () => { assert.equal(E.dataset('001,Ada\n002,Lin','x',{hasHeader:false}).records.length,2); assert.throws(()=>E.parse('\uFEFF \n'),/empty/); });
test('malformed missing duplicate key is rejected',()=>assert.throws(()=>E.clean([E.dataset('a\nx','x')],{dedupe:['no']}),/missing/));
