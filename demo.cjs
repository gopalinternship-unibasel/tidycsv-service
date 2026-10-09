const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const E = require('./engine.cjs');

const input = fs.readFileSync(path.join(__dirname, 'examples/input.csv'), 'utf8');
const expected = E.parse(fs.readFileSync(path.join(__dirname, 'examples/expected.csv'), 'utf8'));
const dataset = E.dataset(input, 'input.csv');
const result = E.clean([dataset], {
  trim: true, emailLower: true, removeBlank: true, dedupe: ['email']
});
assert.deepEqual([result.headers, ...result.rows.map(row => row.values)], expected);
assert.equal(result.stats.inputRows, 6);
assert.equal(result.stats.outputRows, 4);
assert.equal(result.stats.removedRows, 2);
console.log('PASS: fictional sample exactly matches the expected CSV.');
console.log(JSON.stringify(result.stats, null, 2));
