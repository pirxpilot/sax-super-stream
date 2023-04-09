const { describe, it } = require('node:test');
const fs = require('node:fs');
const { pipeline } = require('node:stream/promises');
const { Writable, Readable } = require('stream');

const stream = require('..');

function readStream(name) {
  return fs.createReadStream([__dirname, 'fixtures', name].join('/'));
}

function memory(array) {
  return new Writable({
    objectMode: true,
    write(item, encoding, next) {
      array.push(item);
      next();
    }
  });
}

describe('sax super stream', () => {
  it('should parse a single empty node', async () => {
    const config = {
      'item': stream.object()
    };
    const result = [];

    await pipeline(
      readStream('one.xml'),
      stream(config),
      memory(result)
    );
    result.should.have.length(1);
    result[0].should.eql({});

  });

  it('should parse nodes with text', async () => {
    const config = {
      'two': {
        'item': {
          $: stream.object(),
          'a': { $text: stream.assignTo('A') },
          'b': { $text: stream.assignTo('B') }
        }
      }
    };
    const result = [];

    await pipeline(
      readStream('two.xml'),
      stream(config),
      memory(result)
    );
    result.should.have.length(2);
    result[0].should.have.property('A', 'abc');
    result[0].should.have.property('B', '15');
    result[1].should.have.property('A', 'def');
    result[1].should.have.property('B', '16');


  });

  it('should parse attributes', async () => {
    const config = {
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
    const result = [];

    function appendToCollection({ attributes }, parent) {
      const obj = {
        value: attributes.attr.value
      };
      parent.children = parent.children || [];
      parent.children.push(obj);
    }

    function addToParent({ attributes }, parent) {
      parent.b = attributes.attr.value;
    }

    await pipeline(
      readStream('three.xml'),
      stream(config, { lowercase: true }),
      memory(result)
    );
    let item;
    let a;

    result.should.have.length(1);

    item = result[0];
    item.should.have.property('b', '4');

    a = item.children;
    a.should.have.length(3);
    a[0].should.have.property('value', '1');

  });

  it('should call $after parser if specified', async () => {
    let value = 0;
    const config = {
      'doc': {
        'item': {
          $: stream.object(),
          $after(obj) { obj.value = value++; }
        }
      }
    };
    const result = [];

    await pipeline(
      readStream('ns.xml'),
      stream(config),
      memory(result)
    );

    value.should.be.eql(2);
    result.should.have.length(2);
    result[0].should.have.property('value', 0);
    result[1].should.have.property('value', 1);

  });

  it('should ignore namespace if none declared', async () => {
    const config = {
      'doc': {
        'item': { $: stream.object() }
      }
    };
    const result = [];

    await pipeline(
      readStream('ns.xml'),
      stream(config),
      memory(result)
    );

    result.should.have.length(2);
  });

  it('should accept elements if namespace matches $uri attribute', async () => {
    const config = {
      'doc': {
        $uri: 'http://example.com',
        'item': { $: stream.object() }
      }
    };
    const result = [];

    await pipeline(
      readStream('ns.xml'),
      stream(config),
      memory(result));
    result.should.have.length(2);

  });

  it('should ignore elements if namespace does not match $uri attribute', async () => {
    const config = {
      'doc': {
        $uri: 'http://another.com',
        'item': { $: stream.object() }
      }
    };
    const result = [];

    await pipeline(
      readStream('ns.xml'),
      stream(config),
      memory(result));

    result.should.have.length(0);
  });


  it('should parse CDATA as text', async () => {
    const config = {
      'FOUR': {
        'ITEM': {
          $: stream.object(),
          'A': { $text: stream.assignTo('a') },
          'B': { $text: stream.assignTo('b') }
        }
      }
    };
    const result = [];

    await pipeline(
      readStream('four.xml'),
      stream(config),
      memory(result));

    result.should.have.length(2);
    result[0].should.be.eql({ a: 'abc', b: '15' });
    result[1].should.be.eql({ a: 'def', b: '16' });

  });

  it('should raise errors on invalid XML', async () => {

    const config = {
      'item': { $: stream.object() }
    };

    const from = new Readable({
      read() {}
    });

    const pipe = pipeline(from, stream(config));

    from.push('<item>');
    from.push('</not-item>');
    from.push(null);

    await pipe.should.be.rejectedWith('Unexpected close tag');
  });
});
