const { describe, it } = require('node:test');
const parsers = require('../lib/parsers');

describe('parsers', () => {

  describe('object', () => {

    it('should create a new object', () => {
      const object = parsers.object();

      object().should.eql({});
      object().should.not.be.exactly(object());
    });

    it('should create a new object and assign it to parent', () => {
      let node;
      const parent = {};
      const object = parsers.object('bongo');

      const o = object(node, parent);
      o.should.be.eql({});
      o.should.be.exactly(parent.bongo);
    });
  });


  describe('collection', () => {

    it('should create a new collection', () => {
      const collection = parsers.collection();

      collection().should.eql([]);
      collection().should.not.be.exactly(collection());
    });

    it('should create a new collection and assign it to parent', () => {
      let node;
      const parent = {};
      const collection = parsers.collection('bongo');

      const o = collection(node, parent);
      o.should.be.eql([]);
      o.should.be.exactly(parent.bongo);
    });
  });

  describe('appendToCollection', () => {
    it('should create a new collection and push new object', () => {
      let node;
      const parent = {};
      const atc = parsers.appendToCollection('items');

      const o = atc(node, parent);

      o.should.eql({});
      parent.items.should.have.length(1);
      parent.items[0].should.be.exactly(o);

      const p = atc(node, parent);
      p.should.eql({});
      p.should.not.be.exactly(o);

      parent.items.should.have.length(2);
      parent.items[0].should.be.exactly(o);
      parent.items[1].should.be.exactly(p);
    });
  });

  describe('addChild', () => {
    it('should only add child once', () => {
      let node;
      const parent = {};
      const ac = parsers.addChild('bongo');

      const o = ac(node, parent);
      o.should.be.eql({});
      o.should.be.exactly(parent.bongo);

      o.should.be.exactly(ac(node, parent), 'when called again return the same object');
    });
  });

  describe('assignTo', () => {
    it('should assign value to a named property', () => {
      const parent = {};
      const at = parsers.assignTo('akuku');

      at(5, parent);
      parent.akuku.should.eql(5);
      at('abc', parent);
      parent.akuku.should.eql('abc');
    });
  });

});
