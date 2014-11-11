var requests = {
    
    url: function(url) { //requests a simple url - used when the URL is predefined (typically getAll())
        return {
            'url': url
        };
    },
}

var util = {
    
    version: '2.0', 



    getAll: function(member, request, fn, data) {
        if(data === undefined) { //if no data was passed, create an empty array
            data = [];
        }
        util.appFramework.ajax.apply(util.appFramework, request).done(function(newdata){ //get a page of the request
            data = data.concat(newdata[member]); //add the previously passed data to the new data, using the identifier passed in (for example users)
            if(newdata.next_page === null) { //check to see if there is another page to load
                fn(data);
            } else {
                util.getAll(member, ['url', newdata.next_page], fn, data); //if there is another page, call getAll again - will eventually reach the end and call done()
            }
        });
    }
};

module.exports = {

    factory: function(context, test) {
        _.extend(context.requests, requests); //add in needed requests for the module  
        _.extend(context.requests, test); //add in needed requests for the module                
        util.appFramework = context;
        return  {
            getAll: this.getAll,
        }
    },

    getAll: function(member, request) {
        return util.appFramework.promise(function(done, fail) {
            util.getAll(member, request, done);   
        });
    },

      
};
