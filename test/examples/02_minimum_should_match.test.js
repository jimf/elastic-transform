var test = require('tape')
var traverse = require('../..')
var visitor = require('../../examples/02_minimum_should_match')

test('examples 02. minimum should match', function (t) {
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
        minimum_should_match: 1
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
        must: [{ term: { user: 'kimchy' } }]
      }
    }
  }
  traverse(query, visitor)
  t.deepEqual(query, expected)

  query = {
    query: {
      bool: {
        must: [
          {
            bool: {
              should: [
                { term: { user: 'kimchy' } }
              ]
            }
          }
        ]
      }
    }
  }
  expected = {
    query: {
      bool: {
        must: [
          {
            bool: {
              should: [
                { term: { user: 'kimchy' } }
              ],
              minimum_should_match: 1
            }
          }
        ]
      }
    }
  }
  traverse(query, visitor)
  t.deepEqual(query, expected)

  t.end()
})
