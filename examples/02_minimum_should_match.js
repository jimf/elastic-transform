/**
 * Visitor for adding a "minimum_should_match" clause to bool queries that
 * contain a should.
 */
module.exports = {
  visitor: {
    bool: function (path) {
      // Set minimum_should_match if bool contains a should
      if (path.node.bool.should) {
        path.node.bool.minimum_should_match = 1
      }
    }
  }
}
