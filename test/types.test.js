var test = require('tape')
var subject = require('../src/types')

test('types - getType', function(t) {
  t.equal(subject.getType({ bool: {} }), 'bool', 'identifies bool nodes')
  t.equal(subject.getType({ must: [] }), 'must', 'identifies must nodes')
  t.equal(subject.getType({ term: { foo: 'bar' } }), 'term', 'identifies term nodes')
  t.throws(subject.getType.bind(null), 'throws given no input')
  t.throws(subject.getType.bind(null, {}), 'throws given unknown input')
  t.end()
})

test('types - isBool', function (t) {
  t.equal(subject.isBool({ bool: {} }), true, 'returns true for bool nodes')
  t.equal(subject.isBool({}), false, 'returns false for non-bool nodes')
  t.equal(subject.isBool(null), false, 'returns false for nulls')
  t.end()
})

test('types - isMust', function (t) {
  t.equal(subject.isMust({ must: [] }), true, 'returns true for must nodes')
  t.equal(subject.isMust({}), false, 'returns false for non-must nodes')
  t.equal(subject.isMust(null), false, 'returns false for nulls')
  t.end()
})

test('types - isTerm', function (t) {
  t.equal(subject.isTerm({ term: { foo: 'bar' } }), true, 'returns true for term nodes')
  t.equal(subject.isTerm({}), false, 'returns false for non-term nodes')
  t.equal(subject.isTerm(null), false, 'returns false for nulls')
  t.end()
})
