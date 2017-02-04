var t = require('./types')

function NodePath (node, parent) {
  this.node = node
  this.parent = parent
  this.type = t.getType(node)
}

module.exports = NodePath
