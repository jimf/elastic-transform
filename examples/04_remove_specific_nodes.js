var termFieldsToRemove = ['foo', 'bar']

/**
 * Visitor for adding a top-level must account term to an ElasticSearch query.
 */
module.exports = {
  visitor: {
    term: function (path) {
      // Remove terms whose field value matches the indicated list to remove.
      var field = path.getField()
      if (termFieldsToRemove.indexOf(field) >= 0) {
        path.remove()
      }
    }
  }
}
