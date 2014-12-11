module.exports = function(context) {
    return function(module, settings) { //returns a replacement for require() that already knows what the app framework context is
        var tmp = require(module);      //use the vanilla require function to load the module
        context.require = require('context_loader')(context); //re-add itself to the context (probaby not needed but has come in handy)    
        if(typeof tmp.factory == "function") {  //if the module has a factory function, we will trust that function to initialze things within the module
            return tmp.factory(context, settings);
        }
        if(typeof tmp == "function") {          //if the module returns a bare function instead, _.bind it to the app framework context
            return _.bind(require(module), context, settings);
        }
        return tmp;  //if we can't bind it and it doesn't provide a factory, just return it like normal
    };
};

