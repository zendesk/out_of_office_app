var requests = {

    url: function(url) { //requests a simple url - used when the URL is predefined (typically getAll())
        return {
            'url': url
        };
    },

    jobStatus: function(id) {
        return {
            url: helpers.fmt('/api/v2/job_statuses/%@.json', id)
        };
    }
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

    getRows: function(member, request, pages, done, fail, data, progressCallback) {
        data = data || [];
        if(request[2] === undefined) {  //assumes that the request has one paramater - TODO: generalize
            request.push(1);
        }
        util.appFramework.ajax.apply(util.appFramework, request).done(function(newdata){ //get a page of the request
            data = data.concat(newdata[member]); //add the previously passed data to the new data, using the identifier passed in (for example users)
            if(progressCallback) {
                progressCallback(newdata, data, request);
            }
            if(pages.length <= 0) { //check to see if there is another page to load
                done(data);
            } else {
                request[2] = pages.pop();
                util.getRows(member, request, pages, done, fail, data, progressCallback); //if there is another page, call getAll again - will eventually reach the end and call done()
            }
        }).fail(function(error) {
            util.appFramework.trigger('network_error', {request: request[0], requestType: 'getRows', member: member, data: data, error: error});
            fail(error);
        });
    },

    checkJobStatus: function(id, done, defer, fail) {
        util.appFramework.ajax('jobStatus', id).done(function(response) {
            switch(response['job_status']['status']) {
                case 'queued':
                case 'working':
                    defer(response);
                    break;
                case 'completed':
                    done(response);
                    break;
                case 'failed':
                case 'killed':
                    util.appFramework.trigger('functional_error', {location: 'checkJobStatus', response: response});
                    fail(response);
            }
        }).fail(function(error) {
            util.appFramework.trigger('network_error', {requestType: 'checkJobStatus', id: id, error: error});
            fail(error);
        });
    },

    pollJobStatus: function(id, timeout, interval) {
        var endTime = Number(new Date()) + (timeout || 20000);
        interval = interval || 1000;
        var checkCondition = function(done, fail) {
            util.checkJobStatus(id, done, function(response) {
                if (Number(new Date()) < endTime) {
                    setTimeout(checkCondition, interval, done, fail);
                } else {
                    util.appFramework.trigger('functional_error', {location: 'pollJobStatus', data: {response: response, timout: timeout, interval: interval, message: 'job timed out'}});
                    fail(response);
                }
            }, fail);
        };
        return util.appFramework.promise(checkCondition);
    },

    postPage: function(request, data, index, done, fail, progressCallback) {
        var handleComplete = function(response) {
            if(progressCallback) {
                progressCallback(data[index], response);
            }
            index++;
            if(index == data.length) { //if we are at the last index
                done();
            } else {
                util.postPage(request, data, index, done, fail, progressCallback);
            }
        };
        util.appFramework.ajax(request, data[index]).done(function(response) {
            if(response.job_status !== undefined && util.appFramework.shouldPollJobs()) {
                var id = response.job_status.id;
                util.pollJobStatus(id).done(function(status_response) {
                    handleComplete(status_response);
                }).fail(function(error) {
                    util.appFramework.trigger('network_error', {request: request, requestType: 'postPage', index: index, data: data, error: error});
                    fail(error);
                });
            } else {
                handleComplete(response);
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
        var pipeline = 5;
        return util.appFramework.promise(function(done, fail) {
            util.appFramework.ajax.apply(util.appFramework, request).done(function(data) {
                if(progressCallback) {
                    progressCallback(data, data[member], request);
                }
                var pages = Math.ceil(data.count / 100);
                var sectionLength = pages / pipeline;
                if(pages < 2) {
                    done(data[member]);
                } else {
                    var additional_pages = [];
                    for (var i = 2; i <= pages; i++) {
                        additional_pages.push(i);
                    }
                    var sections = util.splitArray(additional_pages, sectionLength);
                    var requests = [];
                    var final_data = data[member];
                    var one_section = function(section) {
                        return util.appFramework.promise(function(done, fail) {
                            var local_request = request;
                            local_request[2] = section.pop();
                            util.getRows(member, request, section, done, fail, [], progressCallback);
                        });
                    };
                    var concat_data = function(data) {final_data = final_data.concat(data);};

                    sections.forEach(function(section) {
                        requests.push(one_section(section).done(concat_data).fail(fail));
                    });
                    util.appFramework.when.apply(util.appFramework, requests).done(function() {
                        done(final_data);
                    }).fail(fail);
                }
            });
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
