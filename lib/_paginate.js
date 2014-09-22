module.exports = function(a) { //this just paginates our list of users...utility function.
  var results = [];
  var initialRequest = this.ajax(a.request, a.page);
  var allPages = initialRequest.then(function(data) {
    results.push(data[a.entity]);
    var nextPages = [];
    var pageCount = Math.ceil(data.count / 100);
    for (; pageCount > 1; --pageCount) {
      nextPages.push(this.ajax(a.request, pageCount));
    }
    return this.when.apply(this, nextPages).then(function() {
      var entities = _.chain(arguments)
        .flatten()
        .filter(function(item) {
          return (_.isObject(item) && _.has(item, a.entity));
        })
        .map(function(item) {
          return item[a.entity];
        })
        .value();
      results.push(entities);
    }).then(function() {
      return _.chain(results)
        .flatten()
        .compact()
        .value();
    });
  });
  return allPages;
};

