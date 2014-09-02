module.exports = function(context) {
    return function(module) {
        var tmp = require(module);
        context.require = require('context_loader')(context);        
        if(typeof tmp.factory == "function") {
            return tmp.factory(context);
        }
        if(typeof tmp == "function") {
            return _.bind(require(module), context);
        }
        return tmp;
    }
}
