const Saxophone = require('@pirxpilot/saxophone');
const stack = require('./stack');

const debug = require('debug')('sax-super-stream');

/* global TransformStream, EventTarget */


module.exports = initParser;

// used to mark all tags that we want to skip
const IGNORE = Symbol('ignore');

function stripPrefix(name) {
  const prefixed = name.split(':', 2);
  return prefixed[1] ? prefixed : [undefined, prefixed[0]];
}

function makeHandlers(parserConfig, emit) {
  const ns = Object.create(null);
  let defaultNS;
  const items = stack();
  const parsers = stack(parserConfig);
  const context = {};

  const target = new EventTarget();
  target.addEventListener('tagopen', ontagopen);
  target.addEventListener('tagclose', ontagclose);
  target.addEventListener('text', ontext);
  target.addEventListener('cdata', ontext);
  return target;

  function ontagopen({ detail: { name, attrs, isSelfClosing } }) {
    const [prefix, tag] = stripPrefix(name);
    const attrsObj = Saxophone.parseAttrs(attrs);
    updateNamespaces(attrsObj);
    const uri = (prefix && ns[prefix]) ?? defaultNS;

    const tagParser = getParser(tag, uri);

    debug('tagopen', tag, attrs);
    if (!tagParser) {
      parsers.push(IGNORE, tag);
    } else if (typeof tagParser === 'function') {
      parseWith(tagParser);
    } else {
      if (typeof tagParser.$ === 'function') {
        parseWith(tagParser.$);
      }
      parsers.push(tagParser, tag);
    }
    if (isSelfClosing) {
      ontagclose({ detail: { name } });
    }

    function parseWith(tp) {
      const attributes = Object.fromEntries(
        Object.entries(attrsObj).map(
          ([name, value]) => [
            name,
            {
              name,
              value: Saxophone.parseEntities(value)
            }
          ]
        )
      );
      const node = { prefix, tag, attributes };
      const elem = tp.call(items, node, items.top(), context);
      if (elem) {
        items.push(elem, tag);
      }
    }
  }

  function ontagclose({ detail: { name } }) {
    const [, tag] = stripPrefix(name);

    debug('tagclose', tag);

    const parser = parsers.pop(tag);
    if (typeof parser?.$after === 'function') {
      debug('$after', tag);
      parser.$after.call(items, items.top(), context);
    }
    if (parser !== IGNORE) {
      const top = items.pop(tag);
      // if nothing on the stack emit result
      if (top !== undefined && items.empty()) {
        emit(top);
      }
    }
  }

  function ontext({ type, detail: { contents } }) {
    debug('text', contents);

    const textParser = parsers.top().$text;
    textParser?.call(
      items,
      type === 'cdata' ? contents : Saxophone.parseEntities(contents),
      items.top(),
      context
    );
  }

  function updateNamespaces(attrsObj) {
    Object.entries(attrsObj).forEach(xmlns);

    function xmlns([name, value]) {
      if (name === 'xmlns') {
        defaultNS = value;
      } else if (name.startsWith('xmlns:')) {
        const prefix = name.slice(6); // 'xmlns:'.length === 6
        ns[prefix] = value;
      }
    }
  }

  function getParser(tag, uri) {
    const top = parsers.top();
    if (top === IGNORE) {
      return;
    }
    const tp = top[tag];
    if (!tp) {
      return;
    }
    if (!tp.$uri) {
      return tp;
    }
    // if parser specifies namespace, it has to match node namespace
    if (tp.$uri === uri) {
      return tp;
    }
  }
}


function initParser(config) {

  const results = [];

  const target = makeHandlers(config, (...objs) => results.push(...objs));
  const sax = new Saxophone(target);
  const writer = sax.getWriter();

  return new TransformStream({
    async flush(controller) {
      await writer.ready;
      await writer.close();
      flush(controller);
      controller.terminate();
    },
    async transform(chunk, controller) {
      debug('writing', chunk);
      await writer.ready;
      await writer.write(chunk);
      flush(controller);
    }
  });

  function flush(controller) {
    results.forEach(r => controller.enqueue(r));
    results.length = 0;
  }
}
