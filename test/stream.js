var fs = require('fs');
var Writable = require('stream').Writable;

var stream = require('..');

/*global describe, it */


function readStream(name) {
  return fs.createReadStream([__dirname, 'fixtures', name].join('/'));
}

function memory(array) {
  return new Writable({
    objectMode: true,
    write: function (item, encoding, next) {
      array.push(item);
      next();
    }
  });
}

describe('sax super stream', function(){
  it('should parse a single empty node', function(done){
    var config = {
      'item': function() { return {}; }
    };
    var result = [];

    function verify() {
      result.should.have.length(1);
      result[0].should.eql({});
      done();
    }

    readStream('one.xml')
      .pipe(stream(config))
      .pipe(memory(result))
      .on('finish', verify)
      .on('error', done);
  });

  it('should parse nodes with text', function(done){
    var config = {
      'two': {
        'item': {
          $: function() { return {}; },
          'a': { $text: stream.assignTo('A') },
          'b': { $text: stream.assignTo('B') }
        }
      }
    };
    var result = [];

    function verify() {
      result.should.have.length(2);
      result[0].should.have.property('A', 'abc');
      result[0].should.have.property('B', '15');
      result[1].should.have.property('A', 'def');
      result[1].should.have.property('B', '16');
      done();
    }

    readStream('two.xml')
      .pipe(stream(config))
      .pipe(memory(result))
      .on('finish', verify)
      .on('error', done);
  });

  it('should parse attributes', function(done){
    var config = {
      'THREE': {
        'ITEMS': {
          'ITEM': {
            $: function() { return {}; },
            'A': { $: appendToCollection },
            'B': { $: addToParent }
          }
        }
      }
    };
    var result = [];

    function appendToCollection(node, parent) {
      var obj = {
        value: node.attributes.attr.value
      };
      parent.children = parent.children || [];
      parent.children.push(obj);
    }

    function addToParent(node, parent) {
      parent.b = node.attributes.attr.value;
    }

    function verify() {
      var item, a;

      result.should.have.length(1);

      item = result[0];
      item.should.have.property('b', '4');

      a = item.children;
      a.should.have.length(3);
      a[0].should.have.property('value', '1');
      done();
    }

    readStream('three.xml')
      .pipe(stream(config, { lowercase: true }))
      .pipe(memory(result))
      .on('finish', verify)
      .on('error', done);
  });

  it('should parse CDATA as text', function(done) {
    var config = {
      'FOUR': {
        'ITEM': {
          $: function() { return {}; },
          'A': { $text: stream.assignTo('a') },
          'B': { $text: stream.assignTo('b') }
        }
      }
    };
    var result = [];

    function verify() {
      result.should.have.length(2);
      result[0].should.be.eql({ a: 'abc', b: '15' });
      result[1].should.be.eql({ a: 'def', b: '16' });

      done();
    }

    readStream('four.xml')
      .pipe(stream(config))
      .pipe(memory(result))
      .on('finish', verify)
      .on('error', done);
  });

});
