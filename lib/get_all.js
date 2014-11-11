var requests = {
    
    url: function(url) { //requests a simple url - used when the URL is predefined (typically getAll())
        return {
            'url': url
        };
    },
}

var util = {
    
    version: '2.0', 

    stripNumber: function(url) {
        if(url.indexOf("=") != -1) {
            return url.substring(url.lastIndexOf("=")+1);
        } else {
            return undefined;
        }
    },

    splitArray: function(array, chunk) {
        var result = [];
        for (var i = 0; i < array.length; i += chunk) {
            result.push(array.slice(i,i+chunk));
        }
        return result;
    },
    

    getRows: function(member, request, fn, data) {
        if(data === undefined) { //if no data was passed, create an empty array
            data = [];
        }
        if(request[2] === undefined) {
            request.push(1);
        }
        util.appFramework.ajax.apply(util.appFramework, request).done(function(newdata){ //get a page of the request
            data = data.concat(newdata[member]); //add the previously passed data to the new data, using the identifier passed in (for example users)
            if(newdata.next_page === null) { //check to see if there is another page to load
                fn(data);
            } else {
                request[2] = util.stripNumber(newdata.next_page);
                util.getRows(member, request, fn, data); //if there is another page, call getAll again - will eventually reach the end and call done()
            }
        });
    },
 
    postPage: function(request, data, index, fn) { 
        util.appFramework.ajax(request, data[index]).done(function() {
            console.log(index);                
            index++;
            if(index == data.length) {
                fn();
            } else {
                util.postPage(request, data, index, fn);                
            }
        });
    },


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
        _.extend(context.requests, requests); //add in needed requests for the module        
        util.appFramework = context;
        return  {
            getAll: this.getAll,
            getView: this.getView,
            batchPost: this.batchPost,
        }
    },

    getAll: function(member, request) {
        return util.appFramework.promise(function(done, fail) {
            util.getAll(member, request, done);   
        });
    },

    getView: function(member, request) {
        return util.appFramework.promise(function(done, fail) {
            util.getRows(member, request, done);   
        });
    },
    
    batchPost: function(request, data) {
        return util.appFramework.promise(function(done, fail) {
            var split = util.splitArray(data, 100);
            util.postPage(request, split, 0, done);
        });
    },
    
};
