var requests = {
	
	getUserFields: function() {
		return {
			url: '/api/v2/user_fields.json'
		};
	},

	getTriggers: function() {
		return {
			url: '/api/v2/triggers.json'
		};
	},

	createUserField: function() {
		return {
			url: '/api/v2/user_fields.json',
			dataType: 'JSON',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				"user_field": {
					"active": true,
					"description": this.I18n.t('user_field.description'),
					"key": this.options.userFieldKey,
					"position": 0,
					"title": this.I18n.t('user_field.name'),
					"type": "checkbox",
					"tag": this.options.userFieldKey
				}
			})
		};
	},

	tagRemovingTrigger: function() { 
		return {               
			url: '/api/v2/triggers.json',
			dataType: 'JSON',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				"trigger": {
					"title": this.I18n.t('trigger.title.tagRemove'),
					"active": true,
					"position": 0,
					"conditions": {
						"all": [{
							"field": "assignee_id",
							"operator": "changed",
							"value": null
						}],
						"any":[{
							"field": "current_tags",
							"operator": "includes",
							"value": "0421008445828ceb46f476700a5fa65e"
							}],
					},
					"actions": [
					{
						"field": "remove_tags",
						"value": this.options.userFieldKey
					}]
				}
			})
		};
	},

	tagAppendingTrigger: function() {
		return {
			url: '/api/v2/triggers.json',
			dataType: 'JSON',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				"trigger": {
					"title": this.I18n.t('trigger.title.tagAppend'),
					"active": true,
					"position": 0,
					"conditions": {
						"all": [{
							"field": "assignee_id",
							"operator": "changed",
							"value": null,
						}],
						"any":[{
							"field": "current_tags",
							"operator": "includes",
							"value": "0421008445828ceb46f476700a5fa65e"
							}]
					},
					"actions": [{
						"field": "current_tags",
						"value": this.options.userFieldKey
					}]
				}
			})
		};
	},

	flagAppInstalled: function(installID) {
		return {
			url: helpers.fmt('/api/v2/apps/installations/%@.json', installID),
			dataType: 'JSON',
			type: 'PUT',
			contentType: 'application/json',
			data: JSON.stringify({
				"settings": {
					"requirementsCreated": true
				}
			})
		};
	},

	saveToAppSettings: function(payload, installID) {
		return {
			url: helpers.fmt('/api/v2/apps/installations/%@.json', installID),
			dataType: 'JSON',
			type: 'PUT',
			contentType: 'application/json',
			data: JSON.stringify(payload)
		};
	}

};

var util = {

	version: '2.3',    
	
	findObject: function(request, member, attribute, value) {
		return util.appFramework.promise(function(done, fail) {
			util.getAll(member, [request]).done(function(data) {  //simply getAll, then filter by atribute and search string
				var found = _.find(data, function(item) { return item[attribute] == value; }); //use _.find to return the item with a matching title
				done(found);    //will be undefined if nothing is found
			});
		});
	},

	flagInstalled: function() {
		var installID = util.appFramework.installationId();
		if(installID !== 0 && !util.settings.requirementsCreated) { //if we still think we aren't installed, push the flag to the server
			util.appFramework.ajax('flagAppInstalled', installID);
		}
	},

	prepareNewSettings: function(results) {
		var remove = _.chain(results).filter(function(item){return item.trigger_title.indexOf('removal') > -1; }) .map(function(m){return {"id": m.trigger_id }; }) .value();
		var removal_id = remove[0].id;
		var addition = _.chain(results).filter(function(item){return item.trigger_title.indexOf('addition') > -1; }) .map(function(m){return {"id": m.trigger_id }; }) .value();
		var addition_id = addition[0].id;
		var installID = util.appFramework.installationId();
		var payload = {
			"settings":{
				"tagRemovalId": removal_id,
				"tagAdditionId": addition_id
			}

		};
		if(installID !== 0) {
			util.appFramework.ajax('saveToAppSettings', payload, installID);
		}

	},

	installApp: function() {
		return util.appFramework.promise(function(done, fail) {

			util.appFramework.when(
				util.findObject('getUserFields', 'user_fields', 'key', util.settings.userFieldKey),
				util.findObject('getTriggers', 'triggers', 'title', util.appFramework.I18n.t('trigger.title.tagRemove')),
				util.findObject('getTriggers', 'triggers', 'title', util.appFramework.I18n.t('trigger.title.tagAppend'))
			).done(function(field, tagRemove, tagAppend) {  //checks to see that the required logic is in place
				var requests = [];

				if(field === undefined) { //steps through the reqirements and if needed creats the ajax request to create them
					requests.push(util.appFramework.ajax('createUserField'));
				}
				if(tagRemove === undefined) {
					requests.push(util.appFramework.ajax('tagRemovingTrigger'));
				}
				if(tagAppend === undefined) {
					requests.push(util.appFramework.ajax('tagAppendingTrigger'));
				}

				if(requests.length !== 0) { //if there are any requests that need to be run,
					util.appFramework.when.apply(util.appFramework, requests).done(function() { //run them
						var results = _.chain(arguments)
							.flatten()
							.filter(function(obj){
								return obj['trigger'];
							})
							.map(function(trig){
								return {
									"trigger_title": trig.trigger.title,
									"trigger_id": trig.trigger.id
								};
							})
						.value();
						util.prepareNewSettings(results);
						util.flagInstalled();  //we've already created things, don't need to do it again
						done();
					}).fail(function() {
						util.appFramework.trigger('network_error', {request: requests, requestType: 'ajax', error: arguments});
						util.appFramework.trigger('functional_error', {location: 'installApp', requests: requests, foundObjects: [field, tagRemove, tagAppend]});
					});
				} else {
					util.flagInstalled(); //there isn't anything we need to make, no need to search again.
					done();
				}
			});
		}).fail(function() {
			util.appFramework.trigger('functional_error', {location: 'findObject'});
		});
	}

};

module.exports = {

	factory: function(context, settings) {
		_.extend(context.requests, requests); //add in needed requests for the module     
		_.extend(util, context.require('get_all')); //add in getAll methods to util
		_.extend(util, context.require('update_status')); //please don't ask me why this is required, but if you don't load update_status here the requests are never loaded
		util.appFramework = context; //provide the App Framwork to the functions 
		util.settings = settings;
		return {
			loadSettings: this.loadSettings,
		};
	},

	loadSettings: function() {
		var app = util.appFramework;
		var options = util.settings;      //take the passed in object and
		_.extend(options, app.settings);  //add in the app settings loaded from the installation

		if(options.requirementsCreated) { //if we have flagged it as good to go, move on
			app.trigger('loaded_settings', {settings: options});
		} else {
			util.installApp().done(function() { //otherwise, run the installApp method to create requirements
				app.trigger('loaded_settings', {settings: options});
			});
		}
	},
};
