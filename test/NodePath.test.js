var test = require('tape')
var NodePath = require('../src/NodePath')

test('NodePath - instance', function (t) {
  var query = { bool: { must: [{ term: { foo: 'bar' } }] } }
  var subject1 = new NodePath(query, null)
  var subject2 = new NodePath(query.bool, subject1)
  var subject3 = new NodePath({ must: query.bool.must }, subject2)

  t.ok(subject1.node === query, 'retains a reference to given node')
  t.ok(subject1.parent === null, 'retains a reference to given parent')
  t.equal(subject1.type, 'bool', 'has type')
  t.equal(subject3.parent.parent.node, query,
    'supports recursive parent backtracking')

  t.end()
})
