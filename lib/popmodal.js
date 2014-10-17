/* popmodal:
 *
 * Generates the confirmation modal
 *
 * parameters: the header of the modal
 * the content of the modal
 * the text for the label of the confirm button
 * optional text to replace the label of the cancel button
 * Side Effects: creates a modal popup with the specified data,
 * hides that modal's cancel button if none is speficied
 *
 */
var util = {
    version: '.02',
    getOptions: function() {
        var options = [];
        var input = util.appFramework.$(".mymodal span.option :input").not('button');
        for(var i = 0; i < input.length; i++) {
            options.push(input[i]);
        }
        return options;
    }
};

module.exports = {

    factory: function(context) { 
        util.appFramework = context;
        return this.popModal;
    },

    popModal: function(message, onAccept, onCancel) {
        util.appFramework.$('.mymodal').modal({
            backdrop: true,
            keyboard: false,
            header: util.appFramework.$('.modal-header').text(message.header),
            content: util.appFramework.$('.modal-body').html(message.content),
            confirm: util.appFramework.$('.btn-confirm').html(message.confirm),
            cancel: util.appFramework.$('.btn-cancel').html(message.cancel),
            option: util.appFramework.$('span.option').html(message.options)
        });
        util.appFramework.$('.modalAccept').off('click');
        util.appFramework.$('.modalCancel').off('click');
        util.appFramework.$('.modalAccept').on('click', function() {
            util.appFramework.$('.mymodal').modal('hide');
            var options = util.getOptions();
            util.appFramework.$('span.option').html("");            
            if(onAccept !== undefined) {
                onAccept(options);
            }
        });
        util.appFramework.$('.modalCancel').on('click', function() {
            util.appFramework.$('.mymodal').modal('hide');
            var options = util.getOptions();            
            util.appFramework.$('span.option').html("");            

            if(onCancel !== undefined) {
                onCancel(options);
            }
        }); 
    }
};
