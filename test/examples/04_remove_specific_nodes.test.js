var test = require('tape')
var traverse = require('../..')
var visitor = require('../../examples/04_remove_specific_nodes')

test('examples 04. remove specific nodes', function (t) {
  var query
  var expected

  query = {
    query: {
      bool: {
        must: [
          { term: { foo: 'foo value' } },
          { term: { bar: 'bar value' } },
          { term: { baz: 'baz value' } }
        ]
      }
    }
  }
  expected = {
    query: {
      bool: {
        must: [
          { term: { baz: 'baz value' } }
        ]
      }
    }
  }
  traverse(query, visitor)
  t.deepEqual(query, expected)

  t.end()
})
