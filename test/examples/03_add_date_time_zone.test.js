var test = require('tape')
var traverse = require('../..')
var visitor = require('../../examples/03_add_date_time_zone')

test('examples 03. add date time zone', function (t) {
  var query
  var expected

  query = {
    query: {
      bool: {
        must: [
          { term: { account: 12345 } },
          {
            range: {
              age: {
                gte: 10,
                lte: 20
              }
            }
          }
        ],
        should: [
          {
            range: {
              date: {
                gte: 'now-1d/d',
                lt: 'now/d'
              }
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
          { term: { account: 12345 } }
        ],
        should: [
          {
            range: {
              date: {
                gte: 'now-1d/d',
                lt: 'now/d',
                time_zone: '-05:00'
              }
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
