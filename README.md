# ElasticSearch Transform

ElasticSearch query transformation using the [visitor pattern][]

_Work in progress_

## Installation

Install using npm:

    $ npm install elastic-transform

## Usage

__elastic-transform__ exports a `traverse` function which expects an
ElasticSearch query and a visitor object. It will then visit each node in the
query, invoking methods on the visitor as it does so.

### Example

For example, traversing the following visitor would add a `must` clause with an
account term applied:

```js
var visitor = {
  visitor: {
    bool: function (path) {
      path.node.bool.must = path.node.bool.must || []
      if (!Array.isArray(path.node.bool.must)) {
        path.node.bool.must = [path.node.bool.must]
      }
      path.node.bool.must.unshift({ term: { account: accountId } })
      path.stop()
    }
  }
}
```

### Visitor Interface

Visitors can be implemented with plain JavaScript objects of the following
shape:

```js
var visitor = {
  pre: function (state) {
    // Optional pre-traversal callback. May be used to set up state.
  },
  visitor: {
    // Define visitor methods here
    term: function (path, state) {
      // Short visit method form. Invoked on node enter.
    },
    bool: {
      // Long visit form. Specify enter/exit individually.
      enter: function (path, state) {
        // Do something on bool enter
      },
      exit: function (path, state) {
        // Do something else on bool exit, after children have been processed.
      }
    }
  },
  post: function (state) {
    // Optional post-traversal callback. May be used to process state.
  }
}
```

As can be seen above, a state object is threaded throughout the traversal
process, and is passed along to all visit callbacks. This object is only
provided out of convenience. It is not necessary to use, and is not used at
all by the library. Optional `pre` and `post` callbacks can be defined on the
visitor object to set up and process this state as needed.

In order to specify what should happen when any node of an ElasticSearch query
is processed, define a corresponding function or object identified by the type
of the node (one of `query`, `bool`, `must`, `should`, `mustNot`, `filter`,
`term`, `exists`, `match`, `matchAll`, `nested`, `range`, `regexp`,
`geoDistance`). The function form will be executed on enter, while the object
form can be used for advanced enter/exit processing.

### Node Paths

Visit methods are passed 2 arguments: `path` and `state`. Paths are wrappers
around the original nodes and provide a number of additional state attributes
and methods (see below for a full listing), in addition to the raw `node`
itself.

## License

MIT

[visitor pattern]: https://en.wikipedia.org/wiki/Visitor_pattern
