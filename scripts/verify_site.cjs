const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

function element(value = '') {
  const classes = new Set();
  return { value, textContent: '', style: {}, dataset: {}, listeners: {},
    classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) },
    addEventListener(type, fn) { this.listeners[type] = fn; },
    setAttribute() {}, removeAttribute() {}, querySelectorAll: () => [] };
}
const ids = Object.fromEntries(['calc-kwh', 'calc-bill', 'calc-monthly', 'calc-yearly', 'calc-roi', 'calc-roi-bar', 'calc-kwh-out', 'calc-bill-out', 'calc-newbill', 'out-kwp', 'out-co2', 'contact-form', 'form-status'].map(id => [id, element()]));
ids['calc-kwh'].value = '450'; ids['calc-bill'].value = '12000';
const button = element();
ids['contact-form'].querySelector = () => button;
let resets = 0;
ids['contact-form'].reset = () => resets++;
let calls = 0, complete, payload;
const context = {
  document: { getElementById: id => ids[id] || null, querySelector: () => null, querySelectorAll: () => [],
    body: {dataset:{}}, addEventListener: (event, fn) => fn() },
  window: {addEventListener() {}}, localStorage: {getItem: () => null},
  FormData: class { constructor() { this.values = {}; } set(k,v) {this.values[k]=v;} },
  fetch: (_, options) => {calls++; payload = options.body; return new Promise(resolve => complete = resolve);},
  setTimeout, console
};
vm.runInNewContext(fs.readFileSync('js/script.js', 'utf8'), context);
assert.equal(ids['calc-roi'].textContent, '1.9 años');
ids['calc-bill'].value = '1000'; ids['calc-bill'].listeners.input();
assert.equal(ids['calc-roi'].textContent, '23.1 años', 'ROI must not be capped at ten years');
assert.equal(ids['calc-roi-bar'].style.width, '100%');
ids['calc-kwh'].value = '0'; ids['calc-kwh'].listeners.input();
assert.equal(ids['calc-roi'].textContent, '—');
const submit = () => ids['contact-form'].listeners.submit({preventDefault(){}});
async function checkForm() {
  submit(); submit();
  assert.equal(calls, 1, 'Ignore duplicate submissions');
  assert.equal(button.disabled, true);
  assert.equal(payload.values.factura_rd, '1000');
  complete({ok:false}); await new Promise(setImmediate);
  assert.equal(button.disabled, false);
  assert.equal(resets, 0, 'Preserve input after an error');
  assert.match(ids['form-status'].textContent, /No se pudo enviar/);
  submit(); complete({ok:true}); await new Promise(setImmediate);
  assert.equal(resets, 1);
  assert.equal(button.disabled, false);
  console.log('PASS: real calculator script, uncapped ROI, zero input, duplicate submit, error/retry/success, calculator payload. No external requests.');
}
checkForm().catch(e => {console.error(e); process.exitCode=1;});
