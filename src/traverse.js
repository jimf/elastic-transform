var NodePath = require('./NodePath')

function isFunction (val) {
  return Object.prototype.toString.call(val) === '[object Function]'
}

function traverse (query, v) {
  var state = {}
  var visitor = v.visitor
  var stop = false

  function traverseNode (node, parent) {
    if (stop) { return }
    if (Array.isArray(node)) {
      node.slice(0).forEach(function (child) {
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
      if (path._skip) {
        return
      }
      if (path._stop) {
        stop = true
        return
      }
    }

    switch (nodeType) {
      case 'bool':
        Object.keys(node.bool)
        .filter(function (key) {
          return ['must', 'should', 'must_not', 'filter'].indexOf(key) >= 0
        })
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

      case 'emptySearch':
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
        /* istanbul ignore next */
        throw new Error('Unhandled ElasticSearch traversal')
    }

    if (isFunction(onExit)) {
      onExit(path, state)
      if (path._stop) {
        stop = true
        return
      }
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
