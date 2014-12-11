var requests = {
    
    url: function(url) { //requests a simple url - used when the URL is predefined (typically getAll())
        return {
            'url': url
        };
    },
};

var util = {
    
    version: '2.5', 

    stripNumber: function(url) {
        return (url.indexOf("=") != -1) ? url.substring(url.lastIndexOf("=")+1)
                                        : undefined;
    },

    splitArray: function(array, chunk) {
        var result = [];
        for (var i = 0; i < array.length; i += chunk) {
            result.push(array.slice(i,i+chunk));
        }
        return result;
    },
    

    getRows: function(member, request, done, fail, data) {
        data = data || [];
        if(request[2] === undefined) {  //assumes that the request has one paramater - TODO: generalize
            request.push(1);
        }
        util.appFramework.ajax.apply(util.appFramework, request).done(function(newdata){ //get a page of the request
            data = data.concat(newdata[member]); //add the previously passed data to the new data, using the identifier passed in (for example users)
            if(newdata.next_page === null) { //check to see if there is another page to load
                done(data);
            } else {
                request[2] = util.stripNumber(newdata.next_page);
                util.getRows(member, request, done, fail, data); //if there is another page, call getAll again - will eventually reach the end and call done()
            }
        }).fail(function(error) {
            util.appFramework.trigger('network_error', {request: request[0], requestType: 'getRows', member: member, data: data, error: error});
            fail(error);
        });
    },
 
    postPage: function(request, data, index, done, fail) { 
        util.appFramework.ajax(request, data[index]).done(function() {
            index++;
            if(index == data.length) { //if we are at the last index
                done();
            } else {
                util.postPage(request, data, index, done, fail);                
            }
        }).fail(function(error) {
            util.appFramework.trigger('network_error', {request: request, requestType: 'postPage', index: index, data: data, error: error});
            fail(error);
        });
    },


    getAll: function(member, request, done, fail, data) {
        data = data || [];
        util.appFramework.ajax.apply(util.appFramework, request).done(function(newdata){ //get a page of the request
            data = data.concat(newdata[member]); //add the previously passed data to the new data, using the identifier passed in (for example users)
            if(newdata.next_page === null) { //check to see if there is another page to load
                done(data);
            } else {
                util.getAll(member, ['url', newdata.next_page], done, fail, data); //if there is another page, call getAll again - will eventually reach the end and call done()
            }
        }).fail(function(error) {
            util.appFramework.trigger('network_error', {request: request[0], requestType: 'getAll', member: member, data: data, error: error});
            fail(error);
        });
    }
};

module.exports = {

    factory: function(context) {
        _.extend(context.requests, requests); //add in needed requests for the module        
        util.appFramework = context;
        return  {
            getAll: this.getAll,
            getView: this.getView,
            batchPost: this.batchPost,
            postPage: util.postPage,
        };
    },

    getAll: function(member, request) {
        return util.appFramework.promise(function(done, fail) {
            util.getAll(member, request, done, fail);   
        });
    },

    getView: function(member, request) {
        return util.appFramework.promise(function(done, fail) {
            util.getRows(member, request, done, fail);   
        });
    },
    
    batchPost: function(request, data) {
        return util.appFramework.promise(function(done, fail) {
            var split = util.splitArray(data, 100);
            util.postPage(request, split, 0, done, fail);
        });
    },
    
};
