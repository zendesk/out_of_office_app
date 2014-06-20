(function() {

  return {
    events: {
      'app.activated':'init',
      'getAgentList.done':'drawTemplate'
    },

    requests: {
    	getAgentList: function() {
    		return {
    			url: '/api/v2/users.json?role[]=agent&role[]=admin'
    		};
    	}
    },

    init: function() {
    	this.ajax('getAgentList');
    },

    drawTemplate: function(data) {
    	var userlist = _.chain(data.users)
    	.map(function(user){
    		return {
    			id: user.id,
    			name: user.name,
    			role: user.role,
    			tags: user.tags
    		}
    	})
    	.value();
    	console.log(userlist);
    	this.switchTo('main', {
    		userlist: userlist
    	});
    },

    logData: function(data) {
    	console.log(data);
    }
  };

}());
