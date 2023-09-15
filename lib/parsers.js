module.exports = {
  object,
  collection,
  addChild,
  appendToCollection,
  assignTo
};

function object(name) {
  return (node, parent) => addItemToParent({}, name, parent);
}

function collection(name) {
  return (node, parent) => addItemToParent([], name, parent);
}

function addChild(name) {
  return (node, parent) =>
    name in parent ?
      parent[name] :
      addItemToParent({}, name, parent);
}

function appendToCollection(name) {
  return (node, parent) => {
    const child = {};

    if (!parent[name]) {
      parent[name] = [];
    }
    parent[name].push(child);
    return child;
  };
}

function assignTo(property) {
  return (text, obj) => obj[property] = text;
}

function addItemToParent(item, name, parent) {
  if (name !== undefined) {
    parent[name] = item;
  }
  return item;
}
