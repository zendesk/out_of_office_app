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
module.exports = function(messageHeader, messageContent, messageConfirm, messageCancel, agent_id, option) {
    this.$('.mymodal').modal({
        backdrop: true,
        keyboard: false,
        header: this.$('.modal-header').text(messageHeader),
        content: this.$('.modal-body').html(messageContent),
        confirm: this.$('.btn-confirm').html(messageConfirm).attr('value', agent_id),
        cancel: this.$('.btn-cancel').html(messageCancel),
        option: this.$('span.option').html(option)
    }); //side effect
    if (messageCancel === null) {
        this.$('.btn-cancel').hide(); //side effect
    }
};
