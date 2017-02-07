var test = require('tape')
var traverse = require('../..')
var visitor = require('../../examples/01_add_account')

test('examples 01. add account', function (t) {
  var query
  var expected

  query = {
    query: {
      bool: {
        should: [{ term: { user: 'kimchy' } }]
      }
    }
  }
  expected = {
    query: {
      bool: {
        should: [{ term: { user: 'kimchy' } }],
        must: [{ term: { account: 12345 } }]
      }
    }
  }
  traverse(query, visitor)
  t.deepEqual(query, expected)

  query = {
    query: {
      bool: {
        must: [{ term: { user: 'kimchy' } }]
      }
    }
  }
  expected = {
    query: {
      bool: {
        must: [
          { term: { account: 12345 } },
          { term: { user: 'kimchy' } }
        ]
      }
    }
  }
  traverse(query, visitor)
  t.deepEqual(query, expected)

  query = {
    query: {
      bool: {
        must: { term: { user: 'kimchy' } }
      }
    }
  }
  expected = {
    query: {
      bool: {
        must: [
          { term: { account: 12345 } },
          { term: { user: 'kimchy' } }
        ]
      }
    }
  }
  traverse(query, visitor)
  t.deepEqual(query, expected)

  t.end()
})
