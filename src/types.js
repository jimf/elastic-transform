function isObjWithKey (key) {
  return function (node) {
    return node != null && key in node
  }
}

var typeMap = {
  bool: 'bool',
  exists: 'exists',
  geo_distance: 'geoDistance',
  must: 'must',
  must_not: 'mustNot',
  nested: 'nested',
  query: 'query',
  range: 'range',
  regexp: 'regexp',
  should: 'should',
  term: 'term'
}

exports.isBool = isObjWithKey('bool')
exports.isExists = isObjWithKey('exists')
exports.isGeoDistance = isObjWithKey('geo_distance')
exports.isMust = isObjWithKey('must')
exports.isMustNot = isObjWithKey('must_not')
exports.isNested = isObjWithKey('nested')
exports.isQuery = isObjWithKey('query')
exports.isRange = isObjWithKey('range')
exports.isRegexp = isObjWithKey('regexp')
exports.isShould = isObjWithKey('should')
exports.isTerm = isObjWithKey('term')

exports.getType = function getType (node) {
  if (node != null) {
    for (var prop in node) {
      if (node.hasOwnProperty(prop) && prop in typeMap) {
        return typeMap[prop]
      }
    }
  }

  throw new Error('Unrecognized ElasticSearch query node')
}
