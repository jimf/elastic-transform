function isObjWithKey (key) {
  return function (node) {
    return node != null && key in node
  }
}

exports.isBool = isObjWithKey('bool')
exports.isMust = isObjWithKey('must')
exports.isTerm = isObjWithKey('term')

exports.getType = function getType (node) {
  if (exports.isBool(node)) {
    return 'bool'
  } else if (exports.isMust(node)) {
    return 'must'
  } else if (exports.isTerm(node)) {
    return 'term'
  }

  throw new Error('Unrecognized ElasticSearch query node')
}
