var t = require('./types')

var manipMap = {
  must: 'must',
  should: 'should',
  mustNot: 'must_not'
}

var geoDistanceOpts = [
  'distance',
  'distance_type',
  'optimize_bbox',
  '_name',
  'ignore_malformed',
  'validation_method'
]

function snakecase (str) {
  return str.replace(/([A-Z])/g, function ($1) {
    return '_' + $1.toLowerCase()
  })
}

function NodePath (node, parent) {
  this.node = node
  this.parent = parent
  this.type = t.getType(node)
}

Object.keys(t).forEach(function (key) {
  if (key.indexOf('is') === 0) {
    NodePath.prototype[key] = function () {
      return t[key](this.node)
    }
  }
})

/**
 * Recursively search parent nodes, returning the first that is a "logic" node
 * (must, should, or mustNot), or null if no logic node ancestors are found.
 *
 * @return {NodePath|null}
 */
NodePath.prototype.findLogicParent = function findLogicParent () {
  return this.findParent(function (path) {
    return path.isMust() || path.isShould() || path.isMustNot()
  })
}

/**
 * Recursively apply a predicate function to parent nodes, returning the first
 * node that causes the predicate to return true. If no parent nodes are found,
 * return null.
 *
 * @param {function} fn Predicate function to test nodes
 * @return {NodePath|null}
 */
NodePath.prototype.findParent = function findParent (fn) {
  var parent = this.parent
  while (parent != null && !fn(parent)) {
    parent = parent.parent
  }
  return parent
}

/**
 * Return a deeply nested reference within node, or null if not found.
 *
 * @param {string|string[]} objectPath Path within node to return
 * @return {*}
 */
NodePath.prototype.get = function get (objectPath) {
  var keys = Array.isArray(objectPath) ? objectPath : objectPath.split('.')
  return keys.reduce(function (acc, key) {
    return acc && acc[key]
  }, this.node)
}

/**
 * Returns the node field value.
 *
 * @return {string}
 */
NodePath.prototype.getField = function getField () {
  if (this.type === 'exists') {
    return this.node.exists.field
  } else if (['match', 'range', 'regexp', 'term'].indexOf(this.type) >= 0) {
    return Object.keys(this.node[this.type])[0]
  } else if (this.type === 'geoDistance') {
    return Object.keys(this.node.geo_distance).filter(function (key) {
      return geoDistanceOpts.indexOf(key) === -1
    })[0]
  }
  return null
}

/**
 * Return the field/value pair of the current node.
 *
 * @return {*[]}
 */
NodePath.prototype.getPair = function getPair () {
  return [this.getField(), this.getValue()]
}

/**
 * Resolves given object path as a new path, or returns undefined if the path
 * cannot be resolved. Throws if path resolves to an illegal type.
 *
 * @param {string|string[]} objectPath Path within node to return
 * @return {NodePath}
 */
NodePath.prototype.getPath = function getPath (objectPath) {
  var keys = Array.isArray(objectPath) ? objectPath : objectPath.split('.')

  function go (acc, node) {
    if (!acc.length) {
      return node
    }

    var key = acc[0]
    var nextNode = node.node[key]
    var tmp

    if (key.match(/^\d+$/)) {
      nextNode = node.node[snakecase(node.type)][key]
    }

    if (Array.isArray(nextNode)) {
      tmp = {}
      tmp[key] = nextNode
      nextNode = tmp
    }

    if (nextNode === undefined) {
      return
    }

    return go(acc.slice(1), new NodePath(nextNode, node))
  }

  return go(keys, this)
}

/**
 * Returns sibling nodes of the current node.
 *
 * @param {string} sibling Key/index of sibling node to retrieve
 * @return {NodePath|undefined}
 */
NodePath.prototype.getSibling = function getSibling (sibling) {
  if (this.parent == null) { return }
  var sibNode = this.parent.node[snakecase(this.parent.type)][sibling]
  var tmp
  if (sibNode === undefined) { return }
  if (Array.isArray(sibNode)) {
    tmp = {}
    tmp[sibling] = sibNode
    sibNode = tmp
  }
  return new NodePath(sibNode, this.parent.parent)
}

/**
 * Returns the node value.
 *
 * @return {*}
 */
NodePath.prototype.getValue = function getValue () {
  switch (this.type) {
    case 'geoDistance':
    case 'match':
    case 'range':
    case 'regexp':
    case 'term':
      return this.node[snakecase(this.type)][this.getField()]

    default:
      return null
  }
}

/**
 * Insert given node after context node.
 *
 * @param {object} node Node to insert
 */
NodePath.prototype.insertAfter = function insertAfter (node) {
  var container = this.parent && this.parent.node[manipMap[this.parent.type]]
  if (!container) {
    throw new Error('Method not supported by this node')
  }
  container.splice(container.indexOf(this.node) + 1, 0, node)
}

/**
 * Insert given node before context node.
 *
 * @param {object} node Node to insert
 */
NodePath.prototype.insertBefore = function insertBefore (node) {
  var container = this.parent && this.parent.node[manipMap[this.parent.type]]
  if (!container) {
    throw new Error('Method not supported by this node')
  }
  container.splice(container.indexOf(this.node), 0, node)
}

/**
 * Remove node from query.
 */
NodePath.prototype.remove = function remove () {
  this.replaceWithMany([])
}

/**
 * Replace current node with a given node.
 *
 * @param {object} node Node to replace this node with
 */
NodePath.prototype.replaceWith = function replaceWith (node) {
  this.replaceWithMany([node])
}

/**
 * Replace current node with a given nodes.
 *
 * @param {object[]} node Node to replace this node with
 */
NodePath.prototype.replaceWithMany = function replaceWithMany (nodes) {
  var container = this.parent && this.parent.node[manipMap[this.parent.type]]
  if (!container) {
    throw new Error('Method not supported by this node')
  }
  var args = [container.indexOf(this.node), 1].concat(nodes)
  container.splice.apply(container, args)
  this._removed = true
  this.skip()
}

/**
 * Skip traversal of the current branch.
 */
NodePath.prototype.skip = function skip () {
  this._skip = true
}

/**
 * Stop traversal entirely.
 */
NodePath.prototype.stop = function stop () {
  this._stop = true
}

module.exports = NodePath
