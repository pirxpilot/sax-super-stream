const getlet = require('getlet');
const stream = require('..');

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

getlet('https://github.blog/feed/')
  .pipe(stream(PARSERS))
  .on('data', ({title}) => console.log(title));

