import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getNestedValue,
  convertToSeconds,
  convertFromSeconds,
  convertTime,
  hasPermission,
  parseQuantity,
  isRationItem,
  getRestWarningState,
  TIME_INC
} from '../scripts/lib/pure-helpers.mjs';

test('getNestedValue: resolves a nested path', () => {
  const obj = { system: { quantity: { value: 5 } } };
  assert.equal(getNestedValue(obj, 'system.quantity.value'), 5);
});

test('getNestedValue: resolves a single-segment path', () => {
  assert.equal(getNestedValue({ name: 'torch' }, 'name'), 'torch');
});

test('getNestedValue: returns undefined for a missing leaf', () => {
  assert.equal(getNestedValue({ system: {} }, 'system.quantity.value'), undefined);
});

test('getNestedValue: missing intermediate does not throw (regression)', () => {
  // Previously threw "Cannot read properties of undefined".
  assert.doesNotThrow(() => getNestedValue({}, 'system.quantity.value'));
  assert.equal(getNestedValue({}, 'system.quantity.value'), undefined);
});

test('getNestedValue: null/undefined root does not throw', () => {
  assert.equal(getNestedValue(null, 'a.b'), undefined);
  assert.equal(getNestedValue(undefined, 'a'), undefined);
});

test('convertToSeconds: converts each unit', () => {
  assert.equal(convertToSeconds(1, 'minute'), 60);
  assert.equal(convertToSeconds(1, 'turn'), 600);
  assert.equal(convertToSeconds(2, 'hour'), 7200);
  assert.equal(convertToSeconds(1, 'day'), 86400);
});

test('convertToSeconds: parses string durations', () => {
  assert.equal(convertToSeconds('7', 'day'), 7 * 86400);
});

test('convertFromSeconds: floors to whole units', () => {
  assert.equal(convertFromSeconds(600, 'turn'), 1);
  assert.equal(convertFromSeconds(900, 'turn'), 1); // 1.5 turns floors to 1
  assert.equal(convertFromSeconds(86400, 'day'), 1);
});

test('convertToSeconds / convertFromSeconds round-trip whole values', () => {
  for (const unit of Object.keys(TIME_INC)) {
    assert.equal(convertFromSeconds(convertToSeconds(3, unit), unit), 3);
  }
});

test('convertTime: floors by default', () => {
  assert.equal(convertTime(900, 'turn'), 1);
  assert.equal(convertTime(7200, 'hour'), 2);
});

test('convertTime: disp renders fractional > 1 as "N+"', () => {
  assert.equal(convertTime(900, 'turn', true), '1+'); // 1.5 turns
});

test('convertTime: disp does not annotate whole values', () => {
  assert.equal(convertTime(1200, 'turn', true), 2); // exactly 2 turns
});

test('convertTime: disp does not annotate fractional values <= 1', () => {
  assert.equal(convertTime(300, 'turn', true), 0); // 0.5 turns -> 0, no "+"
});

test('hasPermission: true when level meets or exceeds threshold', () => {
  const actor = { ownership: { user1: 3 } };
  assert.equal(hasPermission(actor, 'user1', 3), true);
  assert.equal(hasPermission(actor, 'user1', 2), true);
});

test('hasPermission: false when below threshold or unknown user', () => {
  const actor = { ownership: { user1: 1 } };
  assert.equal(hasPermission(actor, 'user1', 3), false);
  assert.equal(hasPermission(actor, 'unknown', 1), false);
});

test('hasPermission: no ownership object does not throw', () => {
  assert.equal(hasPermission({}, 'user1', 1), false);
});

test('parseQuantity: handles numbers, strings, and fractional representations', () => {
  assert.equal(parseQuantity(5), 5);
  assert.equal(parseQuantity(0), 0);
  assert.equal(parseQuantity(NaN), 0);
  assert.equal(parseQuantity('3'), 3);
  assert.equal(parseQuantity(' 4 '), 4);
  assert.equal(parseQuantity('1/1'), 1);
  assert.equal(parseQuantity('2/3'), 2);
  assert.equal(parseQuantity('10/10'), 10);
  assert.equal(parseQuantity(null), 0);
  assert.equal(parseQuantity(undefined), 0);
  assert.equal(parseQuantity(''), 0);
  assert.equal(parseQuantity('invalid'), 0);
});

test('isRationItem: detects rations via flags and OSE tags', () => {
  // Flag detection
  const flagged = { flags: { 'osr-helper': { itemType: 'ration' } } };
  assert.equal(isRationItem(flagged, false), true);
  assert.equal(isRationItem(flagged, true), true);

  // OSE tag object detection (case-insensitive)
  const taggedObject = { system: { tags: [{ title: 'Ration' }] } };
  assert.equal(isRationItem(taggedObject, true), true);
  assert.equal(isRationItem(taggedObject, false), false);

  const taggedLower = { system: { tags: [{ title: 'ration' }] } };
  assert.equal(isRationItem(taggedLower, true), true);

  // OSE string tag detection
  const taggedString = { system: { tags: ['Ration'] } };
  assert.equal(isRationItem(taggedString, true), true);

  // Non-ration items
  const nonRation = { system: { tags: [{ title: 'Torch' }] } };
  assert.equal(isRationItem(nonRation, true), false);

  const emptyItem = { system: {} };
  assert.equal(isRationItem(emptyItem, true), false);
  assert.equal(isRationItem(null, true), false);
  assert.equal(isRationItem(undefined, true), false);
});

test('getRestWarningState: enforces B/X dungeon rest alert thresholds', () => {
  // Turns 0 to 4: safe
  assert.equal(getRestWarningState(0), 'none');
  assert.equal(getRestWarningState(1), 'none');
  assert.equal(getRestWarningState(4), 'none');

  // Turn 5: orange warning (must rest soon)
  assert.equal(getRestWarningState(5), 'warning');

  // Turns >= 6: red penalty alert (mandatory rest on 6th turn)
  assert.equal(getRestWarningState(6), 'penalty');
  assert.equal(getRestWarningState(7), 'penalty');
  assert.equal(getRestWarningState(10), 'penalty');
});

test('scale separation: dungeon turn vs travel day', () => {
  // Dungeon turn = 10 minutes = 600s
  assert.equal(convertToSeconds(1, 'turn'), 600);
  // Travel day = 24 hours = 86400s
  assert.equal(convertToSeconds(1, 'day'), 86400);
  // 1 travel day = 144 dungeon exploration turns
  assert.equal(convertToSeconds(1, 'day') / convertToSeconds(1, 'turn'), 144);
});

