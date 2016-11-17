//Requests needed by the library go here
var requests = {
        url: function(url) { //requests a simple url - used when the URL is predefined
        return {
            'url': url
        };
    }
};

//Private, module only utilities go in var utility - they will be pulled into
//the functions but won't be accessible to code that requires the module
var util = {
    parseData: function(data) {
        console.log(data);
    }
};

//public functions for the module go in module.exports and are exposed in
//module.exports.factory. functions returned from the factory will have access
//to all other functions and objects defined in the return statement. Here
//we add the appFramework (passed when factory is loaded by context_loader)
//to the util object, as well as any other required modules
module.exports = {

    factory: function(context, settings) {
        _.extend(context.requests, requests); //patch the requests from this module into the app framework
        _.extend(util, context.require('get_all')); //provides access to the getAll and other data fetch methods
        util.appFramework = context; //provide the App Framwork to the functions
        util.settings = settings; //take in passed through settings (if required)
        return {
            internalContext: this.internalContext,
            exampleFunction: this.exampleFunction,
        };
    },

    internalContext: function() {
        console.log(this); // will return a list of items from the return statement in factory()
        console.log(util.appFramework);  //allows access to the app framework
        this.exampleFunction('hello world');     //calls another public method
    },

    exampleFunction: function(data) {
        util.parseData(data);                //use a private function
        util.appFramework.currentUser();             //use the app framework
        util.fetchData.getAll('user_fields', ['getUserFields']).done(function(data) {
            console.log(data);
        });
    }
};
