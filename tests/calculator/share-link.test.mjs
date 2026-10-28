import test from 'node:test';
import assert from 'node:assert/strict';
import { INPUT_GROUPS } from '../../src/features/calculator/constants/input-fields.js';
import { readInputValues } from '../../src/features/calculator/utils/input-values.js';
import { loadFeature } from './helpers.mjs';

const fields = INPUT_GROUPS.flatMap(group => group.fields);
const raw = () => readInputValues(fields.map(field => [field.name, String(field.value)]));

test('deal links round-trip all 40 raw assumptions without rounding, coercion, or private URL state', async () => {
  const encode = await loadFeature('utils/share-link.js', 'encodeDealLink');
  const decode = await loadFeature('utils/share-link.js', 'decodeDealLink');
  const inputs = raw();
  inputs.purchasePrice = '000234000.1234567890123456789';
  inputs.monthlyUtilities.electricity = '0.0000';
  inputs.rentGrowthPercent = '-3.125000000000001';
  inputs.appreciationPercent = '-0';
  const link = encode({...inputs, name: 'PRIVATE NAME', email: 'PRIVATE EMAIL', theme: 'dark'}, 'https://example.com/calculator?email=PRIVATE#contact');
  assert.equal(new URL(link).search, '');
  assert.match(new URL(link).hash, /^#deal=[A-Za-z0-9_-]+$/);
  assert.deepEqual(decode(link), {status: 'valid', inputs});
  const payload = Buffer.from(new URL(link).hash.slice(6), 'base64url').toString();
  assert.doesNotMatch(payload, /PRIVATE|email|theme|name/);
  assert.equal(fields.length, 40);
});

const linkFor = payload => `https://example.com/#deal=${Buffer.from(JSON.stringify(payload)).toString('base64url')}`;

test('encoder rejects missing, unsafe, or oversized assumptions and unsafe destinations without leaking credentials', async () => {
  const encode = await loadFeature('utils/share-link.js', 'encodeDealLink');
  const decode = await loadFeature('utils/share-link.js', 'decodeDealLink');
  for (const bad of [undefined, null, {}, {...raw(), purchasePrice: 1}, {...raw(), purchasePrice: '<script>'}, {...raw(), purchasePrice: '1'.repeat(65)}]) {
    assert.throws(() => encode(bad, 'https://example.com/'), /assumptions/i);
  }
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'https://person:secret@example.com/']) {
    assert.throws(() => encode(raw(), url), /URL/i);
  }
  const inputs = {...raw(), downPaymentPercent:'1000', rentGrowthPercent:'-1000', monthlyRent:'', interestRatePercent:' 1.234e+2 '};
  assert.deepEqual(decode(encode(inputs,'https://example.com/')), {status:'valid',inputs});
  const token = Buffer.from(`{"v":2,"v":1,"values":${JSON.stringify(fields.map(field=>String(field.value)))}}`).toString('base64url');
  assert.equal(decode(`https://example.com/#deal=${token}`).status, 'invalid');
});

test('decoder distinguishes absent links from invalid fragments and rejects malformed or noncanonical payloads', async () => {
  const decode = await loadFeature('utils/share-link.js', 'decodeDealLink');
  for (const url of ['https://example.com/', 'https://example.com/#contact', 'https://example.com/?deal=abc']) {
    assert.deepEqual(decode(url), {status:'none'});
  }
  const values = fields.map(field => String(field.value));
  const invalid = [
    'not a URL', 'https://example.com/#deal=', 'https://example.com/#deal=???',
    'https://example.com/#deal=eyJ2Ijox', 'https://example.com/#deal=abc&theme=dark',
    linkFor({v:2,values}), linkFor({v:1,values:values.slice(1)}), linkFor({v:1,values:[...values,'0']}),
    linkFor({v:1,values,name:'private'}), linkFor({values}), linkFor(null), linkFor([]),
    linkFor({v:1,values:values.map((v,i)=>i===0?12:v)}),
    ...['<img src=x>', 'NaN', 'Infinity', '0x10', '1\n2', '1'.repeat(65), '\u0000', 'name@example.com'].map(value => linkFor({v:1,values:[value,...values.slice(1)]})),
    `https://example.com/#deal=${'a'.repeat(4097)}`,
  ];
  for (const url of invalid) {
    const result = decode(url);
    assert.equal(result.status,'invalid',url);
    assert.equal(result.inputs,undefined);
    assert.ok(result.message);
  }
});
