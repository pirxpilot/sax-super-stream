module.exports = stack;

function stack(init) {
  var items = [];
  var names = [];

  if (init !== undefined) {
    items.push(init);
  }

  return {
    pop: function(name) {
      if (names[names.length - 1] === name) {
        names.pop();
        return items.pop();
      }
    },
    push: function(item, name) {
      names.push(name);
      return items.push(item);
    },
    top: function() { return items[items.length - 1]; },
    empty: function() { return !items.length; }
  };
}
