module.exports = function(context, mock) {
    
    if(mock.ajax !== undefined) {
        context.ajax = context.promise(function(done, fail) {
            arguments.forEach(function(arg) {
                console.log(arg);
            });
            if(mock.ajax.fail) {
                fail(mock.ajax)
            } else {
                done(mock.ajax);
            }
        });
    }

    if(mock.trigger !== undefined) {
        context.trigger = function() {
            arguments.forEach(function(arg) {
                console.log(arg);
            });
        }
    }

    if(mock.renderTemplate !== undefined) {
        context.renderTemplate = function() {
            arguments.forEach(function(arg) {
                console.log(arg);
            });
        }
    }

    return function(module, settings) {
        var tmp = require(module);
        context.require = require('context_loader')(context);        
        if(typeof tmp.factory == "function") {
            return tmp.factory(context, settings);
        }
        if(typeof tmp == "function") {
            return _.bind(require(module), context, settings);
        }
        return tmp;
    };
};


