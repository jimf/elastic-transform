var t = require('./types')

function NodePath (node, parent) {
  this.node = node
  this.parent = parent
  this.type = t.getType(node)
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
