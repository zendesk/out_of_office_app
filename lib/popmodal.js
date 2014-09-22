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
    version: '.02'
}

module.exports = {
    
    factory: function(context) { 
        util.appFramework = context;
        return this.popModal;
    },
    
    popModal: function(message, onAccept, onCancel) { 
        console.log('modal');
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
            if(onAccept !== 'undefined') {
                onAccept();
            };
        });
        util.appFramework.$.$('.modalCancel').on('click', function() {
            util.appFramework.$('.mymodal').modal('hide');
            if(onCancel !== 'undefined') {
                onCancel();
            };
        }); 
    }
};
