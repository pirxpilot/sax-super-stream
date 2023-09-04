const { Transform } = require('stream');
const sax = require('sax');
const debug = require('debug')('sax-super-stream');

const stack = require('./stack');

module.exports = initParser;

// used to mark all tags that we want to skip
const IGNORE = Object.create(null);

function stripPrefix(name) {
  const index = name.indexOf(':');
  return index < 0 ? name : name.slice(index + 1);
}

function handlers(parserConfig, fn) {
  const items = stack();
  const parsers = stack(parserConfig);
  const context = {};
  let cdata;

  function onopentag(node) {
    const tag = node.local;
    const tagParser = verifyNS(parsers.top()[tag]);
    let elem;

    function parseWith(tp) {
      elem = tp.call(items, node, items.top(), context);
      if (elem) {
        items.push(elem, tag);
      }
    }

    // if parser specifies namespace, it has to much naode namespace
    function verifyNS(tp) {
      if (!tp) {
        return tp;
      }
      if (!tp.$uri) {
        return tp;
      }
      if (tp.$uri === node.uri) {
        return tp;
      }
    }

    debug('onopentag', tag);
    if (!tagParser) {
      parsers.push(IGNORE, tag);
      return;
    }
    if (typeof tagParser === 'function') {
      parseWith(tagParser);
    } else {
      if (typeof tagParser.$ === 'function') {
        parseWith(tagParser.$);
      }
      parsers.push(tagParser, tag);
    }
  }

  function onclosetag(tag) {
    let parser;
    let top;

    tag = stripPrefix(tag);

    debug('closetag', tag);

    parser = parsers.pop(tag);
    if (parser && typeof parser.$after === 'function') {
      parser.$after.call(items, items.top(), context);
    }
    if (parser !== IGNORE) {
      top = items.pop(tag);
      // if nothing on the stack emit result
      if (top !== undefined && items.empty()) {
        fn(null, top);
      }
    }
  }

  function ontext(value) {
    const textParser = parsers.top().$text;
    if (textParser) {
      textParser.call(items, value, items.top(), context);
    }
  }

  function onopencdata() {
    const textParser = parsers.top().$text;
    if (textParser) {
      cdata = [];
    }
  }

  function oncdata(value) {
    if (cdata) {
      cdata.push(value);
    }
  }

  function onclosecdata() {
    if (!cdata) {
      return;
    }
    const textParser = parsers.top().$text;
    textParser.call(items, cdata.join(''), items.top(), context);
    cdata = undefined;
  }

  function onerror(err) {
    debug('Detected error', err);
    // mark error as handled
    this.error = null;
    fn(err);
  }

  return {
    onopentag,
    onclosetag,
    ontext,
    onopencdata,
    oncdata,
    onclosecdata,
    onerror
  };
}


function initParser(
  parserConfig,
  saxOptions,
  {
    decoder = new TextDecoder()
  } = {}
) {

  saxOptions = Object.assign({
    trim: true,
    normalize: true,
    lowercase: false,
    xmlns: true,
    position: false,
    strictEntities: true,
    noscript: true
  }, saxOptions);

  const parser = sax.parser(true, saxOptions);
  let results = [];
  let parserError;

  Object.assign(parser, handlers(parserConfig, (err, obj) => {
    if (!err) {
      results.push(obj);
    } else {
      // only report the first error
      parserError = parserError || err;
    }
  }));

  const ts = new Transform({
    readableObjectMode: true,
    flush(next) {
      parser.close();
      if (parserError) {
        return next(parserError);
      }
      flush(this);
      next();
    },
    transform(chunk, encoding, next) {
      if (parserError) {
        return next(parserError);
      }
      write(chunk);
      flush(this);
      next();
    }
  });
  return ts;

  function write(chunk) {
    const str = decoder.decode(chunk);
    parser.write(str);
  }

  function flush(stream) {
    if (!results.length) {
      return;
    }
    results.forEach(r => {
      stream.push(r);
    });
    results = [];
  }
}
