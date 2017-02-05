var test = require('tape')
var subject = require('../src/types')

test('types - getType', function (t) {
  t.equal(subject.getType({ bool: {} }), 'bool', 'identifies bool nodes')
  t.equal(subject.getType({ exists: { field: 'foo' } }), 'exists', 'identifies exists nodes')
  t.equal(subject.getType({ filter: {} }), 'filter', 'identifies filter nodes')
  t.equal(subject.getType({ geo_distance: {} }), 'geoDistance', 'identifies geo_distance nodes')
  t.equal(subject.getType({ match: {} }), 'match', 'identifies match nodes')
  t.equal(subject.getType({ match_all: {} }), 'matchAll', 'identifies match_all nodes')
  t.equal(subject.getType({ must: [] }), 'must', 'identifies must nodes')
  t.equal(subject.getType({ must_not: [] }), 'mustNot', 'identifies must_not nodes')
  t.equal(subject.getType({ nested: {} }), 'nested', 'identifies nested nodes')
  t.equal(subject.getType({ query: {} }), 'query', 'identifies query nodes')
  t.equal(subject.getType({ range: {} }), 'range', 'identifies range nodes')
  t.equal(subject.getType({ regexp: {} }), 'regexp', 'identifies regexp nodes')
  t.equal(subject.getType({ should: [] }), 'should', 'identifies should nodes')
  t.equal(subject.getType({ term: { foo: 'bar' } }), 'term', 'identifies term nodes')
  t.throws(subject.getType, 'throws given no input')
  t.throws(subject.getType.bind({}), 'throws given unknown input')
  t.end()
})

function testIdentifier (funcName, key) {
  test('types - ' + funcName, function (t) {
    var node = {}
    node[key] = {}
    t.equal(subject[funcName](node), true, 'returns true for ' + key + ' nodes')
    t.equal(subject[funcName]({}), false, 'returns false for non-' + key + ' nodes')
    t.equal(subject[funcName](null), false, 'returns false for nulls')
    t.end()
  })
}

testIdentifier('isBool', 'bool')
testIdentifier('isExists', 'exists')
testIdentifier('isFilter', 'filter')
testIdentifier('isGeoDistance', 'geo_distance')
testIdentifier('isMatch', 'match')
testIdentifier('isMatchAll', 'match_all')
testIdentifier('isMust', 'must')
testIdentifier('isMustNot', 'must_not')
testIdentifier('isNested', 'nested')
testIdentifier('isQuery', 'query')
testIdentifier('isRange', 'range')
testIdentifier('isRegexp', 'regexp')
testIdentifier('isShould', 'should')
testIdentifier('isTerm', 'term')
