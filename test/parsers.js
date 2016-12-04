// var should = require('should');
var parsers = require('../lib/parsers');

describe('parsers', function () {

  describe('object', function() {

    it('should create a new object', function() {
      var object = parsers.object();

      object().should.eql({});
      object().should.not.be.exactly(object());
    });

    it('should create a new object and assign it to parent', function() {
      var node;
      var parent = {};
      var object = parsers.object('bongo');

      var o = object(node, parent);
      o.should.be.eql({});
      o.should.be.exactly(parent.bongo);
    });
  });


  describe('collection', function() {

    it('should create a new collection', function() {
      var collection = parsers.collection();

      collection().should.eql([]);
      collection().should.not.be.exactly(collection());
    });

    it('should create a new collection and assign it to parent', function() {
      var node;
      var parent = {};
      var collection = parsers.collection('bongo');

      var o = collection(node, parent);
      o.should.be.eql([]);
      o.should.be.exactly(parent.bongo);
    });
  });

  describe('appendToCollection', function () {
    it('should create a new collection and push new object', function () {
      var node;
      var parent = {};
      var atc = parsers.appendToCollection('items');

      var o = atc(node, parent);

      o.should.eql({});
      parent.items.should.have.length(1);
      parent.items[0].should.be.exactly(o);

      var p = atc(node, parent);
      p.should.eql({});
      p.should.not.be.exactly(o);

      parent.items.should.have.length(2);
      parent.items[0].should.be.exactly(o);
      parent.items[1].should.be.exactly(p);
    });
  });

  describe('addChild', function () {
    it('should only add child once', function () {
      var node;
      var parent = {};
      var ac = parsers.addChild('bongo');

      var o = ac(node, parent);
      o.should.be.eql({});
      o.should.be.exactly(parent.bongo);

      o.should.be.exactly(ac(node,parent), 'when called again return the same object');
    });
  });

  describe('assignTo', function () {
    it('should assign value to a named property', function () {
      var parent = {};
      var at = parsers.assignTo('akuku');

      at(5, parent);
      parent.akuku.should.eql(5);
      at('abc', parent);
      parent.akuku.should.eql('abc');
    });
  });

});
