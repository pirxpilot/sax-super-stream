module.exports = {
  object: object,
  collection: collection,
  addChild: addChild,
  appendToCollection: appendToCollection,
  assignTo: assignTo
};

function addItemToParent(item, name, node, parent) {
  if (name !== undefined) {
    parent[name] = item;
  }
  return item;
}

function object(name) {
  return function(node, parent) {
    return addItemToParent({}, name, node, parent);
  };
}

function collection(name) {
  return function(node, parent) {
    return addItemToParent([], name, node, parent);
  };
}

function addChild(name) {
  return function(node, parent) {
    if (parent[name]) {
      return;
    }
    return addItemToParent({}, name, node, parent);
  };
}

function appendToCollection(name) {
  return function(node, parent) {
    var child = {};

    if (!parent[name]) {
      parent[name] = [];
    }
    parent[name].push(child);
    return child;
  };
}

function assignTo(property) {
  return function (text, obj) {
    obj[property] = text;
  };
}

