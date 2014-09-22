module.exports = {
    
    internalContext: function() {
        console.log(this);
    },

    factory: function(context) { 
        return {
            externalContext: context.require('context_test'),
            internalContext: _.bind(this.internalContext, context),
        }
    }
};
