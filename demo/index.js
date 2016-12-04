var getlet = require('getlet');
var stream = require('..');

var PARSERS = {
  'rss': {
    'channel': {
      'item': {
        $: stream.object,
        'title': {
          $text: function(text, o) { o.title = text; }
        }
      }
    }
  }
};

getlet('http://blog.npmjs.org/rss')
  .pipe(stream(PARSERS))
  .on('data', function(item) {
    console.log(item.title);
  });

