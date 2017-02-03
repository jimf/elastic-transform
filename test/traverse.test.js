var test = require('tape')
var traverse = require('../src/traverse')

function defaultQuery () {
  return { bool: { must: [{ term: { foo: 'bar' } }] } }
}

test('traverse - general visit flow', function (t) {
  var results = []
  var query = defaultQuery()
  var visitor = {
    pre: function () {
      results.push('pre')
    },
    visitor: {
      bool: {
        enter: function () {
          results.push('bool enter')
        },
        exit: function () {
          results.push('bool exit')
        }
      },
      must: {
        enter: function () {
          results.push('must enter')
        },
        exit: function () {
          results.push('must exit')
        }
      },
      term: {
        enter: function () {
          results.push('term enter')
        },
        exit: function () {
          results.push('term exit')
        }
      }
    },
    post: function() {
      results.push('post')
    }
  }

  traverse(query, visitor)

  t.deepEqual(results, [
    'pre',
    'bool enter',
    'must enter',
    'term enter',
    'term exit',
    'must exit',
    'bool exit',
    'post'
  ], 'executes visitor callbacks in expected order')
  t.end()
})

test('traverse - basic visitor', function (t) {
  var results = []
  var query = defaultQuery()
  var visitor = {
    visitor: {
      bool: function () {
        results.push('bool enter')
      },
      must: function () {
        results.push('must enter')
      },
      term: function () {
        results.push('term enter')
      }
    }
  }

  traverse(query, visitor)

  t.deepEqual(results, [
    'bool enter',
    'must enter',
    'term enter'
  ], 'executes visitor callbacks in expected order')
  t.end()
})
