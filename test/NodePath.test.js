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

test('NodePath#getField', function (t) {
  var validCases = [
    {
      input: { match: { foo: 'value' } },
      expected: 'foo'
    },
    {
      input: { term: { foo: 'value' } },
      expected: 'foo'
    },
    {
      input: { range: { foo: { gte: 10 } } },
      expected: 'foo'
    },
    {
      input: { regexp: { foo: '.*value.*' } },
      expected: 'foo'
    },
    {
      input: { exists: { field: 'foo' } },
      expected: 'foo'
    },
    {
      input: {
        geo_distance: {
          distance: '12km',
          distance_type: 'sloppy_arc',
          optimize_bbox: 'memory',
          _name: 'foo',
          ignore_malformed: false,
          validation_method: 'STRICT',
          foo: [-70, 40]
        }
      },
      expected: 'foo'
    }
  ]

  validCases.forEach(function (testcase) {
    var subject = new NodePath(testcase.input, null)
    t.equal(subject.getField(), testcase.expected,
      'returns field value from expected leaf nodes')
  })

  var pathWithoutField = new NodePath({ query: {} }, null)
  t.equal(pathWithoutField.getField(), null,
    'returns null for nodes that do not have a logical field')

  t.end()
})

test('NodePath#get', function (t) {
  var q = {
    query: {
      bool: {
        must: [
          { term: { 'foo.bar': 'value' } }
        ],
        should: [
          { term: { 'baz': 'value' } }
        ],
        must_not: [
          { term: { 'qux': 'value' } }
        ]
      }
    }
  }

  const queryPath = new NodePath(q, null)

  t.equal(queryPath.get('bool'), q.query.bool, 'returns nested reference to nested query object')
  t.equal(queryPath.get('bool.doesNotExist'), undefined, 'returns undefined when path is not found')
  t.equal(queryPath.get('bool.must.0'), q.query.bool.must[0], 'supports returning array elements')
  t.equal(queryPath.get(['bool', 'must', '0', 'term', 'foo.bar']), q.query.bool.must[0].term['foo.bar'],
    'supports specifying object path as an array of keys')

  t.end()
})

test('NodePath#getValue', function (t) {
  var validCases = [
    {
      input: { match: { foo: 'value' } },
      expected: 'value'
    },
    {
      input: { term: { foo: 'value' } },
      expected: 'value'
    },
    {
      input: { range: { foo: { gte: 10 } } },
      expected: { gte: 10 }
    },
    {
      input: { regexp: { foo: '.*value.*' } },
      expected: '.*value.*'
    },
    {
      input: { exists: { field: 'foo' } },
      expected: null
    },
    {
      input: {
        geo_distance: {
          distance: '12km',
          distance_type: 'sloppy_arc',
          optimize_bbox: 'memory',
          _name: 'foo',
          ignore_malformed: false,
          validation_method: 'STRICT',
          foo: [-70, 40]
        }
      },
      expected: [-70, 40]
    }
  ]

  validCases.forEach(function (testcase) {
    var subject = new NodePath(testcase.input, null)
    t.deepEqual(subject.getValue(), testcase.expected,
      'returns value from expected leaf nodes')
  })

  var pathWithoutField = new NodePath({ query: {} }, null)
  t.equal(pathWithoutField.getValue(), null,
    'returns null for nodes that do not have a logical value')

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

  var queryPath = new NodePath(query, null)
  var boolPath = new NodePath(query.query, queryPath)
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

  var queryPath = new NodePath(query, null)
  var boolPath = new NodePath(query.query, queryPath)
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

test('NodePath#isX', function (t) {
  t.ok((new NodePath({ bool: {} })).isBool(), 'returns true for bool nodes')
  t.ok((new NodePath({ exists: { field: 'foo' } })).isExists(), 'returns true for exists nodes')
  t.ok((new NodePath({ filter: {} })).isFilter(), 'identifies filter nodes')
  t.ok((new NodePath({ geo_distance: {} })).isGeoDistance(), 'returns true for geo_distance nodes')
  t.ok((new NodePath({ match: {} })).isMatch(), 'returns true for match nodes')
  t.ok((new NodePath({ match_all: {} })).isMatchAll(), 'returns true for match_all nodes')
  t.ok((new NodePath({ must: [] })).isMust(), 'returns true for must nodes')
  t.ok((new NodePath({ must_not: [] })).isMustNot(), 'returns true for must_not nodes')
  t.ok((new NodePath({ nested: {} })).isNested(), 'returns true for nested nodes')
  t.ok((new NodePath({ query: {} })).isQuery(), 'returns true for query nodes')
  t.ok((new NodePath({ range: {} })).isRange(), 'returns true for range nodes')
  t.ok((new NodePath({ regexp: {} })).isRegexp(), 'returns true for regexp nodes')
  t.ok((new NodePath({ should: [] })).isShould(), 'returns true for should nodes')
  t.ok((new NodePath({ term: { foo: 'bar' } })).isTerm(), 'returns true for term nodes')

  t.notOk((new NodePath({ query: {} })).isBool(), 'returns false for non-bool nodes')
  t.notOk((new NodePath({ query: {} })).isExists(), 'returns false for non-exists nodes')
  t.notOk((new NodePath({ query: {} })).isFilter(), 'identifies non-filter nodes')
  t.notOk((new NodePath({ query: {} })).isGeoDistance(), 'returns false for non-geo_distance nodes')
  t.notOk((new NodePath({ query: {} })).isMatch(), 'returns false for non-match nodes')
  t.notOk((new NodePath({ query: {} })).isMatchAll(), 'returns false for non-match_all nodes')
  t.notOk((new NodePath({ query: [] })).isMust(), 'returns false for non-must nodes')
  t.notOk((new NodePath({ query: [] })).isMustNot(), 'returns false for non-must_not nodes')
  t.notOk((new NodePath({ query: {} })).isNested(), 'returns false for non-nested nodes')
  t.notOk((new NodePath({ bool: {} })).isQuery(), 'returns false for non-query nodes')
  t.notOk((new NodePath({ query: {} })).isRange(), 'returns false for non-range nodes')
  t.notOk((new NodePath({ query: {} })).isRegexp(), 'returns false for non-regexp nodes')
  t.notOk((new NodePath({ query: {} })).isShould(), 'returns false for non-should nodes')
  t.notOk((new NodePath({ query: {} })).isTerm(), 'returns false for non-term nodes')

  t.end()
})

test('NodePath#remove', function (t) {
  var query = {
    query: {
      bool: {
        must: [{ term: { foo: 'foo' } }],
        should: [{ term: { bar: 'bar' } }],
        must_not: [{ term: { baz: 'baz' } }]
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
        must_not: [{ term: { baz: 'baz' } }]
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
        must_not: [{ term: { baz: 'baz' } }]
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
