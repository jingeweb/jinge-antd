import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flush, mount, rt, ui } from '../unit/harness.mjs';

void test('F07 JSX autoComplete writes the native autocomplete attribute', () => {
  mount(ui.NativeAutocompleteProbe, { autoComplete: 'username' });
  assert.equal(document.querySelector('input').autocomplete, 'username');
  assert.equal(document.querySelector('input').getAttribute('autocomplete'), 'username');
});

for (const name of ['Input', 'TextArea', 'Password', 'InputNumber']) {
  void test(`F07 ${name} keeps native autocomplete reactive and clears to its empty default`, async () => {
    const props = rt.vm({ autoComplete: 'username' });
    mount(ui[name], props);
    const field = document.querySelector('input, textarea');
    assert.equal(field.autocomplete, 'username');
    for (const value of ['off', '', undefined, 'email']) {
      props.autoComplete = value;
      await flush();
      assert.equal(field.autocomplete, value ?? '');
      assert.equal(field.getAttribute('autocomplete'), value ?? '');
      assert.equal(Object.hasOwn(field, 'autoComplete'), false);
      assert.equal(document.querySelector('input, textarea'), field);
    }
  });
}
