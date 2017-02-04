var NodePath = require('./NodePath')

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
    var nodeType = path.type
    var onEnter
    var onExit

    if (visitor[nodeType] != null) {
      onEnter = visitor[nodeType].enter || visitor[nodeType]
      onExit = visitor[nodeType].exit
    }

    if (isFunction(onEnter)) {
      onEnter(path, state)
    }

    switch (nodeType) {
      case 'bool':
        ['must', 'should', 'must_not', 'filter']
        .filter(function (key) { return node.bool[key] })
        .forEach(function (key) {
          var subNode = {}
          subNode[key] = node.bool[key]
          traverseNode(subNode, path)
        })
        break

      case 'filter':
      case 'must':
      case 'nested':
      case 'query':
      case 'should':
        traverseNode(node[nodeType], path)
        break

      case 'mustNot':
        traverseNode(node.must_not, path)
        break

      case 'exists':
      case 'geoDistance':
      case 'match':
      case 'matchAll':
      case 'range':
      case 'regexp':
      case 'term':
        // No children. Nothing to do.
        break

      default:
        throw new Error('Unhandled ElasticSearch traversal')
    }

    if (isFunction(onExit)) {
      onExit(path, state)
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
