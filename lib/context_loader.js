module.exports = function(context) {
    return function(module) {
        return _.bind(require(module), context);
    }
}
