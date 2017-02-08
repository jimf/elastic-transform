function isObjWithKey (key) {
  return function (node) {
    return node != null && key in node
  }
}

var IS_NUMERIC = /^[+-]?\d+(\.\d+)?$/

var typeMap = {
  bool: 'bool',
  exists: 'exists',
  filter: 'filter',
  geo_distance: 'geoDistance',
  match: 'match',
  match_all: 'matchAll',
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
exports.isFilter = isObjWithKey('filter')
exports.isGeoDistance = isObjWithKey('geo_distance')
exports.isMatch = isObjWithKey('match')
exports.isMatchAll = isObjWithKey('match_all')
exports.isMust = isObjWithKey('must')
exports.isMustNot = isObjWithKey('must_not')
exports.isNested = isObjWithKey('nested')
exports.isQuery = isObjWithKey('query')
exports.isRange = isObjWithKey('range')
exports.isRegexp = isObjWithKey('regexp')
exports.isShould = isObjWithKey('should')
exports.isTerm = isObjWithKey('term')

exports.isNumericRange = function (node) {
  if (!exports.isRange(node)) { return false }
  var value = node.range[Object.keys(node.range)[0]]
  if (value.format || value.time_zone) { return false }
  return ['gt', 'gte', 'lt', 'lte'].every(function (op) {
    return value[op] === undefined || IS_NUMERIC.test(String(value[op]))
  })
}

exports.isEmptySearch = function (node) {
  return node == null || Object.keys(node).length === 0
}

exports.getType = function getType (node) {
  if (node != null) {
    for (var prop in node) {
      if (node.hasOwnProperty(prop) && prop in typeMap) {
        return typeMap[prop]
      }
    }
  }

  if (exports.isEmptySearch(node)) {
    return 'emptySearch'
  }

  throw new Error('Unrecognized ElasticSearch query node')
}
