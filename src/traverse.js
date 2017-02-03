var NodePath = require('./NodePath')
var t = require('./types')

function isFunction (val) {
  return toString.call(val) === '[object Function]'
}

function traverse (query, v) {
  var state = {}
  var visitor = v.visitor

  function traverseNode (node, parent) {
    if (Array.isArray(node)) {
      node.forEach(function (child) {
        traverseNode(child, parent)
      })
      return
    }

    var path = new NodePath(node, parent)
    var nodeType = t.getType(node)
    var onEnter
    var onExit

    if (visitor[nodeType] != null) {
      onEnter = visitor[nodeType].enter || visitor[nodeType]
      onExit = visitor[nodeType].exit
    }

    if (isFunction(onEnter)) {
      onEnter.call(null, path, state)
    }

    switch (nodeType) {
      case 'bool':
        ['must']
        .forEach(function (key) {
          var subNode = {}
          subNode[key] = node.bool[key]
          traverseNode(subNode, path)
        })
        break

      case 'must':
        traverseNode(node.must, path)
        break

      case 'term':
        // No children. Nothing to do.
        break

      default:
        throw new Error('Unhandled ElasticSearch traversal')
    }

    if (isFunction(onExit)) {
      onExit.call(null, path, state)
    }
  }

  if (isFunction(v.pre)) {
    v.pre.call(null, state)
  }
  traverseNode(query, null)
  if (isFunction(v.post)) {
    v.post.call(null, state)
  }
}

module.exports = traverse
