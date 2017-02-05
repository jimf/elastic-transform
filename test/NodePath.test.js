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

test('NodePath#findParent', function (t) {
  var query = { bool: { must: [{ term: { foo: 'bar' } }] } }
  var path1 = new NodePath(query, null)
  var path2 = new NodePath(query.bool, path1)
  var subject = new NodePath({ must: query.bool.must }, path2)

  function findBool (node) {
    return node.type === 'bool'
  }
  function findNothing () {
    return false
  }

  t.equal(subject.findParent(findBool).type, 'bool',
    'finds the first parent to pass a truth test')
  t.equal(subject.findParent(findNothing), null,
    'returns null if no parent passes truth test')
  t.end()
})

test('NodePath#insertAfter', function (t) {
  var query = {
    query: {
      bool: {
        must: [{ term: { foo: 'foo' } }],
        should: [{ term: { foo: 'foo' } }],
        must_not: [{ term: { foo: 'foo' } }]
      }
    }
  }
  var mustPath = new NodePath({ must: query.query.bool.must }, null)
  var mustTermPath = new NodePath(query.query.bool.must[0], mustPath)
  var shouldPath = new NodePath({ should: query.query.bool.should }, null)
  var shouldTermPath = new NodePath(query.query.bool.should[0], shouldPath)
  var mustNotPath = new NodePath({ must_not: query.query.bool.must_not }, null)
  var mustNotTermPath = new NodePath(query.query.bool.must_not[0], mustNotPath)

  var newNode = { term: { bar: 'bar' } }

  mustTermPath.insertAfter(newNode)
  shouldTermPath.insertAfter(newNode)
  mustNotTermPath.insertAfter(newNode)

  function insertWithoutParent () {
    queryPath.insertAfter(newNode)
  }
  function insertUnimplemented () {
    boolPath.insertAfter(newNode)
  }

  t.equal(query.query.bool.must.indexOf(newNode), 1, 'inserts node after self in must array')
  t.equal(query.query.bool.should.indexOf(newNode), 1, 'inserts node after self in should array')
  t.equal(query.query.bool.must_not.indexOf(newNode), 1, 'inserts node after self in must_not array')
  t.throws(insertWithoutParent, 'throws if parent is null')
  t.throws(insertUnimplemented, 'throws if node remove is unimplemented')
  t.end()
})

test('NodePath#insertBefore', function (t) {
  var query = {
    query: {
      bool: {
        must: [{ term: { foo: 'foo' } }],
        should: [{ term: { foo: 'foo' } }],
        must_not: [{ term: { foo: 'foo' } }]
      }
    }
  }
  var mustPath = new NodePath({ must: query.query.bool.must }, null)
  var mustTermPath = new NodePath(query.query.bool.must[0], mustPath)
  var shouldPath = new NodePath({ should: query.query.bool.should }, null)
  var shouldTermPath = new NodePath(query.query.bool.should[0], shouldPath)
  var mustNotPath = new NodePath({ must_not: query.query.bool.must_not }, null)
  var mustNotTermPath = new NodePath(query.query.bool.must_not[0], mustNotPath)

  var newNode = { term: { bar: 'bar' } }

  mustTermPath.insertBefore(newNode)
  shouldTermPath.insertBefore(newNode)
  mustNotTermPath.insertBefore(newNode)

  function insertWithoutParent () {
    queryPath.insertBefore(newNode)
  }
  function insertUnimplemented () {
    boolPath.insertBefore(newNode)
  }

  t.equal(query.query.bool.must.indexOf(newNode), 0, 'inserts node before self in must array')
  t.equal(query.query.bool.should.indexOf(newNode), 0, 'inserts node before self in should array')
  t.equal(query.query.bool.must_not.indexOf(newNode), 0, 'inserts node before self in must_not array')
  t.throws(insertWithoutParent, 'throws if parent is null')
  t.throws(insertUnimplemented, 'throws if node remove is unimplemented')
  t.end()
})

test('NodePath#remove', function (t) {
  var query = {
    query: {
      bool: {
        must: [{ term: { foo: 'foo' } }],
        should: [{ term: { bar: 'bar' } }],
        must_not: [{ term: { baz: 'baz' } }],
      }
    }
  }

  var queryPath = new NodePath(query, null)
  var boolPath = new NodePath(query.query, queryPath)
  var mustPath = new NodePath({ must: query.query.bool.must }, boolPath)
  var mustTermPath = new NodePath(query.query.bool.must[0], mustPath)
  var shouldPath = new NodePath({ should: query.query.bool.should }, boolPath)
  var shouldTermPath = new NodePath(query.query.bool.should[0], shouldPath)
  var mustNotPath = new NodePath({ must_not: query.query.bool.must_not }, boolPath)
  var mustNotTermPath = new NodePath(query.query.bool.must_not[0], mustNotPath)

  mustTermPath.remove()
  shouldTermPath.remove()
  mustNotTermPath.remove()

  function removeWithoutParent () {
    queryPath.remove()
  }
  function removeUnimplemented () {
    boolPath.remove()
  }

  t.deepEqual(query.query.bool.must, [], 'removes node from must array')
  t.deepEqual(query.query.bool.should, [], 'removes node from should array')
  t.deepEqual(query.query.bool.must_not, [], 'removes node from must_not array')
  t.ok(mustTermPath._removed, 'sets internal removed flag')
  t.ok(mustTermPath._skip, 'sets internal skip flag')
  t.throws(removeWithoutParent, 'throws if parent is null')
  t.throws(removeUnimplemented, 'throws if node remove is unimplemented')
  t.end()
})

test('NodePath#replaceWith', function (t) {
  var query = {
    query: {
      bool: {
        must: [{ term: { foo: 'foo' } }],
        should: [{ term: { bar: 'bar' } }],
        must_not: [{ term: { baz: 'baz' } }],
      }
    }
  }

  var queryPath = new NodePath(query, null)
  var boolPath = new NodePath(query.query, queryPath)
  var mustPath = new NodePath({ must: query.query.bool.must }, boolPath)
  var mustTermPath = new NodePath(query.query.bool.must[0], mustPath)
  var shouldPath = new NodePath({ should: query.query.bool.should }, boolPath)
  var shouldTermPath = new NodePath(query.query.bool.should[0], shouldPath)
  var mustNotPath = new NodePath({ must_not: query.query.bool.must_not }, boolPath)
  var mustNotTermPath = new NodePath(query.query.bool.must_not[0], mustNotPath)

  var newNode = { exists: { field: 'qux' } }

  mustTermPath.replaceWith(newNode)
  shouldTermPath.replaceWith(newNode)
  mustNotTermPath.replaceWith(newNode)

  function replaceWithoutParent () {
    queryPath.remove()
  }
  function replaceUnimplemented () {
    boolPath.remove()
  }

  t.deepEqual(query.query.bool.must, [newNode], 'replaces node in must array')
  t.deepEqual(query.query.bool.should, [newNode], 'replaces node in should array')
  t.deepEqual(query.query.bool.must_not, [newNode], 'replaces node in must_not array')
  t.ok(mustTermPath._removed, 'sets internal removed flag')
  t.ok(mustTermPath._skip, 'sets internal skip flag')
  t.throws(replaceWithoutParent, 'throws if parent is null')
  t.throws(replaceUnimplemented, 'throws if node remove is unimplemented')
  t.end()
})

test('NodePath#replaceWithMany', function (t) {
  var query = {
    query: {
      bool: {
        must: [{ term: { foo: 'foo' } }],
        should: [{ term: { bar: 'bar' } }],
        must_not: [{ term: { baz: 'baz' } }],
      }
    }
  }

  var queryPath = new NodePath(query, null)
  var boolPath = new NodePath(query.query, queryPath)
  var mustPath = new NodePath({ must: query.query.bool.must }, boolPath)
  var mustTermPath = new NodePath(query.query.bool.must[0], mustPath)
  var shouldPath = new NodePath({ should: query.query.bool.should }, boolPath)
  var shouldTermPath = new NodePath(query.query.bool.should[0], shouldPath)
  var mustNotPath = new NodePath({ must_not: query.query.bool.must_not }, boolPath)
  var mustNotTermPath = new NodePath(query.query.bool.must_not[0], mustNotPath)

  var newNodes = [{ exists: { field: 'qux' } }, { exists: { field: 'norf' } }]

  mustTermPath.replaceWithMany(newNodes)
  shouldTermPath.replaceWithMany(newNodes)
  mustNotTermPath.replaceWithMany(newNodes)

  function replaceWithoutParent () {
    queryPath.remove()
  }
  function replaceUnimplemented () {
    boolPath.remove()
  }

  t.deepEqual(query.query.bool.must, newNodes, 'replaces node in must array')
  t.deepEqual(query.query.bool.should, newNodes, 'replaces node in should array')
  t.deepEqual(query.query.bool.must_not, newNodes, 'replaces node in must_not array')
  t.ok(mustTermPath._removed, 'sets internal removed flag')
  t.ok(mustTermPath._skip, 'sets internal skip flag')
  t.throws(replaceWithoutParent, 'throws if parent is null')
  t.throws(replaceUnimplemented, 'throws if node remove is unimplemented')
  t.end()
})

test('NodePath#skip', function (t) {
  var query = { bool: { must: [{ term: { foo: 'bar' } }] } }
  var subject = new NodePath(query, null)
  subject.skip()
  t.equal(subject._skip, true, 'sets internal skip flag')
  t.end()
})

test('NodePath#stop', function (t) {
  var query = { bool: { must: [{ term: { foo: 'bar' } }] } }
  var subject = new NodePath(query, null)
  subject.stop()
  t.equal(subject._stop, true, 'sets internal stop flag')
  t.end()
})
