(function() {

  return {

    defaultState: 'loading',
    triggerTitle: 'out-of-office app trigger',
    userFieldName: 'Agent Out?',
    userFieldKey: 'agent_ooo',
    users: [],

    events: require('events'), //magic happens here

    requests: require('requests')     
 
    };

}());
