var util = {
    version: '.5',
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

    factory: function(context) {
        util.appFramework = context;
        return  this.getAll;
    },

    getAll: function(member, request) {
        return util.appFramework.promise(function(done, fail) {
            
            util.getAll(member, request, done);   
        });
    },
};
