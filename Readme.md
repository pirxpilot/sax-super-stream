[![NPM version][npm-image]][npm-url]
[![Build Status][build-image]][build-url]
[![Dependency Status][deps-image]][deps-url]

# sax-super-stream

Transform stream converting XML into object by applying hierarchy of element parsers. It's
implemented using [sax] parser, which allows it to process large XML files in a memory efficient manner.
It's very flexible: by configuring element parsers only for those elements, from which you need to
extract data, you can avoid creating an intermediary representation of the entire XML structure.

## Install

```sh
$ npm install --save sax-super-stream
```

## Usage

Example below shows how to print the titles of the articles from RSS feed.

```js
const PARSERS = {
  'rss': {
    'channel': {
      'item': {
        $: stream.object,
        'title': {
          $text(text, o) { o.title = text; }
        }
      }
    }
  }
};

const res = await fetch('http://blog.npmjs.org/rss');
const rssStream = res.body
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(stream(PARSERS));

for await (const item of rssStream) {
  console.log('title: %s', item.title);
}
```

More examples can be found in [Furkot][] [GPX][furkot-import-gpx] and [KML][furkot-import-kml] importers.

## API

### `stream(parserConfig[, options])`

Create transform stream that reads XML and writes objects

- `parserConfig` - contains hierarchical configuration of element parsers, each entry correspondes to the XML element tree,
each value describes the action performed when an element is encountered during XML parsing

- `options` - optional set of options passed to [sax] parser - defaults are as follows

  - `trim` - true
  - `normalize` - true
  - `lowercase` - false
  - `xmlns` - true
  - `position` - false
  - `strictEntities` - true
  - `noscript` - true

#### `parserConfig`

`parserConfig` is a hierarchical object that contains references to either parse functions or other `parseConfig` objects

_parse function_ - `function(xmlnode, object, context)`

  - `xmlnode` - [sax] node with attributes
  - `object` - contains reference to the currently constructed object if any
  - `context` - provided to be used by parser functions, it can be used to store intermediatry data

`this` is bound to current parsed object stack

_parse config reference_ - `object`

each propery of the object represents a **direct** child element of the parsed node in XML hierachy,
  special `$` is a self reference

```
'item': parseItemFunction
```

is the same as:

```
'item': {
  '$': parseItemFunction
}
```

#### special values

- `$after` - `function(object, context)` - called when element tag is closed, element content is parsed
- `$text` - `function(text, object, context)` - called when element content is encountered
- `$uri` - `string` - if specified it should match element namespace, otherwise element will be ignored,
  if `$uri` is not specified namespaces are ignored

#### predefined parsers

There are several predefined parser functions that can be used in parser config:

- `object(name)` - creates a new object and optionally assigns it to parent's `name` property
- `collection(name)` - creates a new Array and optionally assigns it to parent's `name` property
- `appendToCollection(name)` - create a new object and append to Array stored in parent's `name` property, create a new Array if it does not exist yet
- `assignTo(name)` - assign value to the parent's property `name`

## License

MIT © [Damian Krzeminski](https://pirxpilot.me)

[Furkot]: https://furkot.com
[furkot-import-gpx]: https://npmjs.org/package/@furkot/import-gpx
[furkot-import-kml]: https://npmjs.org/package/@furkot/import-kml
[sax]: https://npmjs.org/package/sax-js

[npm-image]: https://img.shields.io/npm/v/sax-super-stream
[npm-url]: https://npmjs.org/package/sax-super-stream

[build-url]: https://github.com/pirxpilot/sax-super-stream/actions/workflows/check.yaml
[build-image]: https://img.shields.io/github/actions/workflow/status/pirxpilot/sax-super-stream/check.yaml?branch=main

[build-url]: https://github.com/pirxpilot/sax-super-stream/actions/workflows/check.yaml
[build-image]: https://img.shields.io/github/actions/workflow/status/pirxpilot/sax-super-stream/check.yaml?branch=main

[deps-image]: https://img.shields.io/librariesio/release/npm/sax-super-stream
[deps-url]: https://libraries.io/npm/sax-super-stream
