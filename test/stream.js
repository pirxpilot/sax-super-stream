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
      'item': stream.object()
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
          $: stream.object(),
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
            $: stream.object(),
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

  it('should call $after parser if specified', function(done) {
    var value = 0;
    var config = {
      'doc': {
        'item': {
          $: stream.object(),
          $after: function(obj) { obj.value = value++; }
        }
      }
    };
    var result = [];

    function verify() {
      value.should.be.eql(2);
      result.should.have.length(2);
      result[0].should.have.property('value', 0);
      result[1].should.have.property('value', 1);
      done();
    }

    readStream('ns.xml')
      .pipe(stream(config))
      .pipe(memory(result))
      .on('finish', verify)
      .on('error', done);
  });

  it('should ignore namespace if none declared', function(done) {
    var config = {
      'doc': {
        'item': { $: stream.object() }
      }
    };
    var result = [];

    function verify() {
      result.should.have.length(2);
      done();
    }

    readStream('ns.xml')
      .pipe(stream(config))
      .pipe(memory(result))
      .on('finish', verify)
      .on('error', done);
  });

  it('should accept elements if namespace matches $uri attribute', function(done) {
    var config = {
      'doc': {
        $uri: 'http://example.com',
        'item': { $: stream.object() }
      }
    };
    var result = [];

    function verify() {
      result.should.have.length(2);
      done();
    }

    readStream('ns.xml')
      .pipe(stream(config))
      .pipe(memory(result))
      .on('finish', verify)
      .on('error', done);
  });

  it('should ignore elements if namespace does not match $uri attribute', function(done) {
    var config = {
      'doc': {
        $uri: 'http://another.com',
        'item': { $: stream.object() }
      }
    };
    var result = [];

    function verify() {
      result.should.have.length(0);
      done();
    }

    readStream('ns.xml')
      .pipe(stream(config))
      .pipe(memory(result))
      .on('finish', verify)
      .on('error', done);
  });


  it('should parse CDATA as text', function(done) {
    var config = {
      'FOUR': {
        'ITEM': {
          $: stream.object(),
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
