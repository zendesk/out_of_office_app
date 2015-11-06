var requests = {
    
    url: function(url) { //requests a simple url - used when the URL is predefined (typically getAll())
        return {
            'url': url
        };
    },
};

var util = {
    
    version: '3.0.0',

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
    

    getRows: function(member, request, done, fail, data, progressCallback) {
        data = data || [];
        if(request[2] === undefined) {  //assumes that the request has one paramater - TODO: generalize
            request.push(1);
        }
        util.appFramework.ajax.apply(util.appFramework, request).done(function(newdata){ //get a page of the request
            data = data.concat(newdata[member]); //add the previously passed data to the new data, using the identifier passed in (for example users)
            if(progressCallback) {
                progressCallback(newdata, data, request);
            }
            if(newdata.next_page === null) { //check to see if there is another page to load
                done(data);
            } else {
                request[2] = util.stripNumber(newdata.next_page);
                util.getRows(member, request, done, fail, data, progressCallback); //if there is another page, call getAll again - will eventually reach the end and call done()
            }
        }).fail(function(error) {
            util.appFramework.trigger('network_error', {request: request[0], requestType: 'getRows', member: member, data: data, error: error});
            fail(error);
        });
    },
 
    postPage: function(request, data, index, done, fail, progressCallback) {
        util.appFramework.ajax(request, data[index]).done(function(response) {
            if(progressCallback) {
                progressCallback(data[index], response);
            }
            index++;
            if(index == data.length) { //if we are at the last index
                done();
            } else {
                util.postPage(request, data, index, done, fail, progressCallback);
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
            pipelinePost: this.pipelinePost,
            postPage: util.postPage,
            bulkUpdate: this.bulkUpdate
        };
    },

    getAll: function(member, request) {
        return util.appFramework.promise(function(done, fail) {
            util.getAll(member, request, done, fail);   
        });
    },

    getView: function(member, request, progressCallback) {
        return util.appFramework.promise(function(done, fail) {
            util.getRows(member, request, done, fail, [], progressCallback);
        });
    },
    
    pipelinePost: function(request, data, sections, progressCallback) {
        return util.appFramework.promise(function(done, fail) {
            var sectionLength = data.length / sections;
            var split = data.length >= sections ? util.splitArray(data, sectionLength) : util.splitArray(data, 1);
            var requests = [];
            split.forEach(function(splitData) {
                requests.push(util.appFramework.promise(function(done, fail) {
                    util.postPage(request, splitData, 0, done, fail, progressCallback);
                }));
            });
            util.appFramework.when.apply(util.appFramework, requests).done(done).fail(fail);
        });
    },

    bulkUpdate: function(request, idList, paramaters, sections, progressCallback) {
        var split = idList.length >= sections ? util.splitArray(idList, 100) : util.splitArray(idList, 1);
        split = split.map(function(splitIds) {
            return {
                idList: splitIds,
                paramaters: paramaters
            };
        });
        return this.pipelinePost(request, split, sections, progressCallback);
    }
};
