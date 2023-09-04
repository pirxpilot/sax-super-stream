const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');

const stream = require('..');

function readStream(name) {
  return fs.createReadStream(path.join(__dirname, 'fixtures', name));
}

/* global WritableStream, ReadableStream, TextDecoderStream */

function memory(array) {
  return new WritableStream({
    write: item => array.push(item)
  });
}

test('should parse a single empty node', async () => {
  const config = {
    'item': stream.object()
  };
  const result = [];

  await pipeline(
    readStream('one.xml'),
    new TextDecoderStream(),
    stream(config),
    memory(result)
  );

  assert.deepEqual(result, [{}]);
});

test('should parse nodes with text', async () => {
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
    new TextDecoderStream(),
    stream(config),
    memory(result)
  );
  assert.deepEqual(result, [
    { A: 'abc', B: '15' },
    { A: 'def', B: '16' }
  ]);
});

test('should parse nested nodes', async () => {
  const itemParser = {
    $: (_, parent) => parent.item = {},
    a: { $text: stream.assignTo('A') }
  };
  itemParser.item = itemParser;
  const config = {
    nested: {
      $: stream.object(),
      item: itemParser
    }
  };
  const result = [];

  await pipeline(
    readStream('nested.xml'),
    new TextDecoderStream(),
    stream(config),
    memory(result)
  );
  assert.deepEqual(result, [{
    item: {
      A: 'abc',
      item: {
        A: 'def',
        item: {
          A: 'ghi',
        }
      }
    }
  }]);
});

test('should parse attributes', async () => {
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
    new TextDecoderStream(),
    stream(config, { lowercase: true }),
    memory(result)
  );

  assert.deepEqual(result, [{
    b: '4',
    children: [
      { value: '1' },
      { value: '2' },
      { value: '3' }
    ]
  }]);
});

test('should call $after parser if specified', async () => {
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
    new TextDecoderStream(),
    stream(config),
    memory(result)
  );

  assert.equal(value, 2);
  assert.deepEqual(result, [
    { value: 0 },
    { value: 1 }
  ]);
});

test('should ignore namespace if none declared', async () => {
  const config = {
    'doc': {
      'item': { $: stream.object() }
    }
  };
  const result = [];

  await pipeline(
    readStream('ns.xml'),
    new TextDecoderStream(),
    stream(config),
    memory(result)
  );

  assert.deepEqual(result, [{}, {}]);
});

test('should accept elements if namespace matches $uri attribute', async () => {
  const config = {
    'doc': {
      $uri: 'http://example.com',
      'item': { $: stream.object() }
    }
  };
  const result = [];

  await pipeline(
    readStream('ns.xml'),
    new TextDecoderStream(),
    stream(config),
    memory(result)
  );
  assert.deepEqual(result, [{}, {}]);
});

test('should ignore elements if namespace does not match $uri attribute', async () => {
  const config = {
    'doc': {
      $uri: 'http://another.com',
      'item': { $: stream.object() }
    }
  };
  const result = [];

  await pipeline(
    readStream('ns.xml'),
    new TextDecoderStream(),
    stream(config),
    memory(result)
  );
  assert.deepEqual(result, []);
});


test('should parse CDATA as text', async () => {
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
    new TextDecoderStream(),
    stream(config),
    memory(result)
  );

  assert.deepEqual(result, [
    { a: 'abc', b: '15' },
    { a: 'def', b: '16' }
  ]);
});

test('should parse entities in text but not in CDATA', async () => {
  const config = {
    doc: {
      item: {
        $: stream.object(),
        $text: stream.assignTo('a'),
      }
    }
  };
  const result = [];

  const from = ReadableStream.from([
    '<doc>',
    '<item>1&lt;2</item>',
    '<item><![CDATA[1&2]]></item>',
    '</doc>'
  ]);

  await pipeline(
    from,
    stream(config),
    memory(result)
  );

  assert.deepEqual(result, [
    { a: '1<2' },
    { a: '1&2' }
  ]);
});

test('should raise errors on invalid XML', async () => {
  const config = {
    'item': { $: stream.object() }
  };

  const from = ReadableStream.from([
    '<item>',
    '</not-item>'
  ]);

  const pipe = pipeline(from, stream(config), memory([]));
  await assert.rejects(pipe, /unclosed tag: item/i);
});
