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
    post: function () {
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

test('traverse - general query traversal', function (t) {
  function runTest (testcase) {
    var visits = []
    var visitor = {
      visitor: {
        bool: function () { visits.push('bool') },
        exists: function () { visits.push('exists') },
        filter: function () { visits.push('filter') },
        geoDistance: function () { visits.push('geoDistance') },
        match: function () { visits.push('match') },
        matchAll: function () { visits.push('matchAll') },
        must: function () { visits.push('must') },
        mustNot: function () { visits.push('mustNot') },
        nested: function () { visits.push('nested') },
        query: function () { visits.push('query') },
        range: function () { visits.push('range') },
        regexp: function () { visits.push('regexp') },
        should: function () { visits.push('should') },
        term: function () { visits.push('term') }
      }
    }
    traverse(testcase.input, visitor)
    t.deepEqual(visits, testcase.expected)
  }

  [
    {
      input: {
        query: {
          bool: {
            should: [
              { exists: { field: 'foo' } },
              {
                range: {
                  date: {
                    gte: 'now-1d/d'
                  }
                }
              },
              { regexp: { foo: '.*"bar".*' } }
            ]
          }
        }
      },
      expected: ['query', 'bool', 'should', 'exists', 'range', 'regexp']
    },

    {
      input: {
        query: {
          bool: {
            must_not: [
              {
                nested: {
                  path: 'foo',
                  query: {
                    bool: {
                      must: [
                        { match: { foo: 'bar' } }
                      ]
                    }
                  }
                }
              }
            ]
          }
        }
      },
      expected: ['query', 'bool', 'mustNot', 'nested', 'query', 'bool', 'must', 'match']
    },

    {
      input: {
        query: {
          bool: {
            must: {
              match_all: {}
            },
            filter: {
              geo_distance: {
                distance: '12km',
                'pin.location': [-70, 40]
              }
            }
          }
        }
      },
      expected: ['query', 'bool', 'must', 'matchAll', 'filter', 'geoDistance']
    }
  ].forEach(runTest)
  t.end()
})

test('traverse - when a branch is skipped', function (t) {
  t.plan(2)

  var query = {
    query: {
      bool: {
        must: [{ term: { foo: 'bar' } }],
        should: [{ term: { baz: 'qux' } }]
      }
    }
  }
  var visitor = {
    pre: function (state) {
      state.fooTermVisited = false
      state.bazTermVisited = false
    },
    visitor: {
      must: function (path) {
        path.skip()
      },
      term: function (path, state) {
        if (path.node.term.foo) {
          state.fooTermVisited = true
        }
        if (path.node.term.baz) {
          state.bazTermVisited = true
        }
      }
    },
    post: function (state) {
      t.equal(state.fooTermVisited, false, 'skips traversing children of skipped node')
      t.equal(state.bazTermVisited, true, 'continues traversal elsewhere')
      t.end()
    }
  }

  traverse(query, visitor)
})

test('traverse - when traversal is stopped', function (t) {
  t.plan(2)

  var query = {
    query: {
      bool: {
        must: [{ term: { foo: 'bar' } }],
        should: [{ term: { baz: 'qux' } }]
      }
    }
  }
  var visitor1 = {
    pre: function (state) {
      state.termVisited = false
    },
    visitor: {
      must: function (path) {
        path.stop()
      },
      term: function (path, state) {
        state.termVisited = true
      }
    },
    post: function (state) {
      t.ok(!state.termVisited, 'stops traversal entirely')
    }
  }
  var visitor2 = {
    pre: function (state) {
      state.shouldVisited = false
    },
    visitor: {
      must: {
        exit: function (path) {
          path.stop()
        }
      },
      should: function (path, state) {
        state.shouldVisited = true
      }
    },
    post: function (state) {
      t.ok(!state.shouldVisited, 'supports stop within exit routine')
    }
  }

  traverse(query, visitor1)
  traverse(query, visitor2)

  t.end()
})
