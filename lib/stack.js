module.exports = stack;

function stack(init) {
  const items = [];
  const names = [];

  if (init !== undefined) {
    items.push(init);
  }

  return {
    pop(name) {
      if (names[names.length - 1] === name) {
        names.pop();
        return items.pop();
      }
    },
    push(item, name) {
      names.push(name);
      return items.push(item);
    },
    top(index = 0) {
      return items[items.length - (index + 1)];
    },
    empty() { return !items.length; }
  };
}
