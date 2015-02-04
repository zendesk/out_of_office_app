module.exports = function(context, mock) {

    mockFramework = _.extend({}, context)
 
    if(mock.ajax !== undefined) {
        mockFramework.ajax = function(request) {
            console.log(arguments);
            return context.promise(function(done, fail) {
                if(mock.ajax[request].fail) {
                    fail(mock.ajax[request]);
                } else {
                    done(mock.ajax[request]);
                } 
            });
        }        
    }

    if(mock.trigger !== undefined) {
        mockFramework.trigger = function() {
            console.log(arguments);
        }
    }

    if(mock.renderTemplate !== undefined) {
        mockFramework.renderTemplate = function() {
            console.log(arguments);
        }
    }

    return function(module, settings) {
        var tmp = require(module);
        mockFramework.require = require('context_loader')(mockFramework);                
        if(typeof tmp.factory == "function") {
            return tmp.factory(mockFramework, settings);
        }
        if(typeof tmp == "function") {
            return _.bind(require(module), mockFramework, settings);
        }
        return tmp;
    };
};


