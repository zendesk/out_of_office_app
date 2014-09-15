//Private, module only utilities go in var utility - they will be pulled into
//any of the functions but won't be accessible when the module is required
var utility = {
}

//public functions for the module go in module.exports and are exposed in 
//module.exports.factory. functions returned from the factory will have access
//to all other functions and objects defined in the return statement. Here
//we add the appFramework (passed when factory is loaded by context_loader)
//as an additional parameter so that the functions can use it
module.exports = {

    factory: function(context) {
        utility.appFramework = context; //provide the App Framwork to the private functions
        console.log('fetch_data');
        return {
            getAll: this.getAll,
            getUserFieldID: this.getUserFieldID,
            getTriggerID: this.getTriggerID,
            checkInstalled: this.checkInstalled,
            appFramework: context
        }
    },


    getAll: function(member, request, data) {
        if(data === undefined) { //if no data was passed, create an empty array
            data = [];
        }
        var getAll = this.getAll; //needed since we will be loosing the module context when we .apply
        return appFramework.promise(function(done, fail) {  //create a promise that will return done when there are no more pages
            appFramework.ajax.apply(this, request).done(function(newdata){ //get a page of the request
                data = data.concat(newdata[member]); //add the previously passed data to the new data, using the identifier passed in (for example users)
                if(newdata.next_page === null) { //check to see if there is another page to load
                    done(data); //if no more pages, call done() and pass the collected data
                } else {
                    getAll(member, ['url', newdata.next_page], data); //if there is another page, call getAll again - will eventually reach the end and call done()
                }
            });
        });
    },


    getUserFieldID: function() {
        if(appFramework.settings('UserFieldID') != undefined) {
            return appFramework.settings('UserFieldID');                                            //if the settings are loaded, just return the settings value
        }
        this.getAll('user_fields', ['getUserFields']).done(function(data) {
            var field = _.find(data, function(field) { return field.key == appFramework.userFieldKey }); //use _.find to return the first field with a matching key
            if(field == undefined) {  //will be undefined if the filter failed to find something
                return undefined     //if it isn't found, return undefined.
            } else {
                return field.id;      //return the field ID
            }
        });
    },

    getTriggerID: function() {
        if(appFramework.settings('triggerID') != undefined) {
            return appFramework.settings('triggerID');                                            //if the settings are loaded, just return the settings value
        }
        this.getAll('triggers', ['getTriggers']).done(function(data) {
            var trigger = _.find(data, function(field) { return trigger.title == appFramework.triggerTitle }); //use _.find to return the first trigger with a matching title
            if(field == undefined) {  //will be undefined if the filter failed to find something
                return undefined     //if it isn't found, return undefined.
            } else {
                return trigger.id;      //return the trigger ID
            }
        });
    },   

    
    checkInstalled: function() {
        return this.promise(function(done, fail) {  //load the values for trigger and field IDs
            var field = this.getUserFieldID();
            var trigger = this.getTriggerID();
            if(field == undefined || trigger == undefined) { //if either of them are unable to be found
                fail();                                     //call the fail method
            } else {
                done(field, trigger);                       //otherwise, succeed and return the IDs
            }
        });
    }

};
