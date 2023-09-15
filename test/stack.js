const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const stack = require('../lib/stack');

describe('stack', () => {

  describe('top', () => {

    it('should return undefined for an empty stack', () => {
      const s = stack();
      assert.equal(s.top(), undefined);
    });

    it('should return pushed item', () => {
      const s = stack(5);

      assert.equal(s.top(), 5);

      s.push('abc');
      assert.equal(s.top(), 'abc');
      assert.equal(s.top(1), 5);

      s.push(/abc/);
      assert.deepEqual(s.top(), /abc/);
      assert.equal(s.top(1), 'abc');
      assert.equal(s.top(2), 5);
      assert.equal(s.top(3), undefined);
    });

  });

  describe('push/pop', () => {

    it('pop should return previously pushed item', () => {
      const s = stack();

      assert.ok(s.empty());
      assert.equal(s.pop(), undefined);

      s.push('abc');
      s.push('cda');

      assert.ok(!s.empty(), 'should not be empty');

      assert.equal(s.pop(), 'cda');
      assert.equal(s.pop(), 'abc');

      assert.ok(s.empty());
    });

    it('pop should only return item if pushed tag matches', () => {
      const s = stack();

      assert.ok(s.empty());
      assert.equal(s.pop(), undefined);

      s.push('abc', 'T1');
      s.push('cda', 'T2');

      assert.equal(s.pop(), undefined);
      assert.equal(s.pop('T1'), undefined);
      assert.equal(s.pop('xxx'), undefined);

      assert.equal(s.pop('T2'), 'cda');

      assert.equal(s.pop(), undefined);
      assert.equal(s.pop('T2'), undefined);

      assert.equal(s.pop('T1'), 'abc');

      assert.ok(s.empty());
    });
  });

});
