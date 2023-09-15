const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const parsers = require('../lib/parsers');

describe('parsers', () => {

  describe('object', () => {

    it('should create a new object', () => {
      const object = parsers.object();

      assert.deepEqual(object(), {});
      assert.notEqual(object(), object());
    });

    it('should create a new object and assign it to parent', () => {
      const parent = {};
      const object = parsers.object('bongo');

      let node;
      const o = object(node, parent);
      assert.deepEqual(o, {});
      assert.equal(o, parent.bongo);
    });
  });


  describe('collection', () => {

    it('should create a new collection', () => {
      const collection = parsers.collection();

      assert.deepEqual(collection(), []);
      assert.notEqual(collection(), collection());
    });

    it('should create a new collection and assign it to parent', () => {
      let node;
      const parent = {};
      const collection = parsers.collection('bongo');

      const o = collection(node, parent);
      assert.deepEqual(o, []);
      assert.equal(o, parent.bongo);
    });
  });

  describe('appendToCollection', () => {
    it('should create a new collection and push new object', () => {
      let node;
      const parent = {};
      const atc = parsers.appendToCollection('items');

      const o = atc(node, parent);

      assert.deepEqual(o, {});
      assert.equal(parent.items.length, 1);
      assert.equal(parent.items[0], o);

      const p = atc(node, parent);
      assert.deepEqual(p, {});
      assert.notEqual(p, o);

      assert.equal(parent.items.length, 2);
      assert.equal(parent.items[0], o);
      assert.equal(parent.items[1], p);
    });
  });

  describe('addChild', () => {
    it('should only add child once', () => {
      let node;
      const parent = {};
      const ac = parsers.addChild('bongo');

      const o = ac(node, parent);
      assert.deepEqual(o, {});
      assert.equal(o, parent.bongo);

      assert.equal(o, ac(node, parent), 'when called again return the same object');
    });
  });

  describe('assignTo', () => {
    it('should assign value to a named property', () => {
      const parent = {};
      const at = parsers.assignTo('akuku');

      at(5, parent);
      assert.equal(parent.akuku, 5);
      at('abc', parent);
      assert.equal(parent.akuku, 'abc');
    });
  });

});
