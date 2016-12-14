var Transform = require('stream').Transform;
var StringDecoder = require('string_decoder').StringDecoder;
var sax = require('sax');
var debug = require('debug')('sax-super-stream');

var stack = require('./stack');

module.exports = initParser;

// used to mark all tags that we want to skip
var IGNORE = Object.create(null);


function stripPrefix(name) {
  var index = name.indexOf(':');
  return index < 0 ? name : name.slice(index + 1);
}


function handlers(parserConfig, fn) {
  var
    items = stack(),
    parsers = stack(parserConfig),
    context = {},
    cdata;

  function onopentag(node) {
    var tag = node.local;
    var tagParser = verifyNS(parsers.top()[tag]);
    var elem;

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
    var parser, top;

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
    var textParser = parsers.top().$text;
    if (textParser) {
      textParser.call(items, value, items.top(), context);
    }
  }

  function onopencdata() {
    var textParser = parsers.top().$text;
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
    var textParser = parsers.top().$text;
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
    onopentag: onopentag,
    onclosetag: onclosetag,
    ontext: ontext,
    onopencdata: onopencdata,
    oncdata: oncdata,
    onclosecdata: onclosecdata,
    onerror: onerror
  };
}


function initParser(parserConfig, saxOptions) {

  saxOptions = Object.assign({
    trim: true,
    normalize: true,
    lowercase: false,
    xmlns: true,
    position: false,
    strictEntities: true,
    noscript: true
  }, saxOptions);

  var parser = sax.parser(true, saxOptions);
  var decoder = new StringDecoder('utf8');
  var results = [];
  var parserError;
  var ts;

  Object.assign(parser, handlers(parserConfig, function(err, obj) {
    if (!err) {
      results.push(obj);
    } else {
      // only report the first error
      parserError = parserError || err;
    }
  }));

  function write(chunk) {
    var str = decoder.write(chunk);
    parser.write(str);
  }

  function flush(stream) {
    if (!results.length) {
      return;
    }
    results.forEach(function(r) {
      stream.push(r);
    });
    results = [];
  }

  ts = new Transform({
    readableObjectMode: true,
    flush: function(next) {
      parser.close();
      if (parserError) {
        return next(parserError);
      }
      flush(this);
      next();
    },
    transform: function(chunk, encoding, next) {
      if (parserError) {
        return next(parserError);
      }
      write(chunk);
      flush(this);
      next();
    }
  });
  return ts;
}

