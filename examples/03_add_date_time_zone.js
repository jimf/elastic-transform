var dateIndices = ['date']
var timezone = '-05:00'

/**
 * Visitor for adding a "time_zone" clause to date range nodes.
 */
module.exports = {
  visitor: {
    range: function (path) {
      var field = path.getField()
      if (dateIndices.indexOf(field) >= 0) {
        path.node.range[field].time_zone = timezone
      }
    }
  }
}
