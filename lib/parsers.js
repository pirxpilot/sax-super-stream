module.exports = {
  object,
  collection,
  addChild,
  appendToCollection,
  assignTo
};

function addItemToParent(item, name, node, parent) {
  if (name !== undefined) {
    parent[name] = item;
  }
  return item;
}

function object(name) {
  return (node, parent) => {
    return addItemToParent({}, name, node, parent);
  };
}

function collection(name) {
  return (node, parent) => {
    return addItemToParent([], name, node, parent);
  };
}

function addChild(name) {
  return (node, parent) => {
    if (name in parent) {
      return parent[name];
    }
    return addItemToParent({}, name, node, parent);
  };
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
  return (text, obj) => {
    obj[property] = text;
  };
}
