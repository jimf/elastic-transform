var accountId = 12345

/**
 * Visitor for adding a top-level must account term to an ElasticSearch query.
 */
module.exports = {
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
