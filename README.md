# ElasticSearch Transform

ElasticSearch query transformations using the [visitor pattern][].

_Work in progress_

## Installation

Install using npm:

    $ npm install elastic-transform

## Usage

__elastic-transform__ exports a `traverse` function which expects an
ElasticSearch query and a visitor object. It will then visit each node in the
query, invoking methods on the visitor as it does so, corresponding with the
type of the node being visited. Depending on the visitor, the query may be
modified in place.

### Example

Traversing an ElasticSearch query with the following visitor would add a `must`
clause specifying an account value:

```js
var traverse = require('elastic-traverse')

var visitor = {
  visitor: {
    bool: function (path) {
      // Ensure a must node exists and is an array.
      path.node.bool.must = path.node.bool.must || []
      if (!Array.isArray(path.node.bool.must)) {
        path.node.bool.must = [path.node.bool.must]
      }

      // Prepend an account term to the must.
      path.node.bool.must.unshift({ term: { account: accountId } })

      // Stop traversal. Only apply transform to the first bool traversed.
      path.stop()
    }
  }
}

var elasticQuery = {
  query: {
    bool: {
      should: [{ term: { user: 'kimchy' } }]
    }
  }
}

traverse(elasticQuery, visitor)
console.log(elasticQuery)
//=> {
//=>   query: {
//=>     bool: {
//=>       should: [{ term: { user: 'kimchy' } }],
//=>       must: [{ term: account: 42 }]
//=>     }
//=>   }
//=> }
```

See the [examples](examples/) directory for this and more examples.

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
and methods, in addition to the raw `node` itself.

#### Path Properties

##### `path.node`

Raw node reference in the query. Modifying this object will in turn modify the
query.

##### `path.parent`

Parent path. Recursive reference to parent node(s) up the tree. `path.parent`
will be `null` for the root node of the query.

##### `path.type`

Type of the node. Types generally correspond directly with their ElasticSearch
counterparts, though they will be in camelcase (e.g., `geoDistance`) rather
than snake case.

#### Path Methods

##### `path.findLogicParent()`

Walk up the query tree, returning the first "logic" node found (`must`,
`should`, or `mustNot`), or `undefined`.

##### `path.findParent(callback)`

Walk up the query tree, calling the callback function with the current node
path. Return the first node where the callback returns `true`, or otherwise,
return `undefined`.

##### `path.get(objectPath)`

Helper method around manually looking up deeply nested keys on `path.node`.
`path.get` can be called with a dot-delimited string (e.g., "bool.must.0"),
that in addition to being more terse, is also null-safe (i.e., if a sub-path
is `undefined`, the method will return `undefined` rather than throw).

`path.get` may also be called with an array of keys if any keys contain a dot.

##### `path.getField()`

Return the "field" value of a leaf node. For example, if `path.node` pointed to
a `term` node of `{ term: { user: "kimchy" } }`, `path.getField()` would return
`"user"`.

##### `path.getPair()`

Return the "field" and "value" pair of a leaf node. For example, if `path.node`
pointed to a `term` node of `{ term: { user: "kimchy" } }`, `path.getPair()`
would return `["user", "kimchy"]`.

##### `path.getPath(objectPath)`

Identical in functionality to `path.get`, except that the return value will be
wrapped as a node path. Note that this means this method will throw if the
resolved path is not a traversable node.

##### `path.getSibling(siblingKey)`

Return a sibling node with the given `siblingKey`, i.e., an object key or array
index.

##### `path.getValue()`

Return the "value" of a leaf node. For example, if `path.node` pointed to a
`term` node of `{ term: { user: "kimchy" } }`, `path.getValue()` would return
`"kimchy"`.

##### `path.insertAfter(node)`

Insert the given node immediately after the current node. This method should
only be called on nodes whose parents are `must`/`should`/`mustNot` arrays.

##### `path.insertBefore(node)`

Insert the given node immediately before the current node. This method should
only be called on nodes whose parents are `must`/`should`/`mustNot` arrays.

##### `path.isBool()`

Is the current node a `bool` node?

##### `path.isEmptySearch()`

Is the current node an empty search?

##### `path.isExists()`

Is the current node an `exists` node?

##### `path.isFilter()`

Is the current node a `filter` node?

##### `path.isGeoDistance()`

Is the current node a `geoDistance` node?

##### `path.isMatch()`

Is the current node a `match` node?

##### `path.isMatchAll()`

Is the current node a `matchAll` node?

##### `path.isMust()`

Is the current node a `must` node?

##### `path.isMustNot()`

Is the current node a `mustNot` node?

##### `path.isNested()`

Is the current node a `nested` node?

##### `path.isNumericRange()`

Is the current node a numeric `range` node?

__NOTE:__ This method returns a best guess, based on the value of the node.
When in doubt, refer to your ElasticSearch index.

##### `path.isQuery()`

Is the current node a `query` node?

##### `path.isRange()`

Is the current node a `range` node?

##### `path.isRegexp()`

Is the current node a `regexp` node?

##### `path.isShould()`

Is the current node a `should` node?

##### `path.isTerm()`

Is the current node a `term` node?

##### `path.remove()`

Remove the current node from the query. This method may throw if `path.parent`
is `null`, or if the node cannot be removed.

##### `path.replaceWith(node)`

Replace the current node with a new node. This method may throw if
`path.parent` is `null`, or if the node cannot be replaced.

##### `path.replaceWithMany(nodeList)`

Like `path.replaceWith`, but accepts an array of nodes.

##### `path.skip()`

Trigger the query traversal to skip any further descendants of the current
node.

##### `path.stop()`

Stop traversal entirely.

## License

MIT

[visitor pattern]: https://en.wikipedia.org/wiki/Visitor_pattern
