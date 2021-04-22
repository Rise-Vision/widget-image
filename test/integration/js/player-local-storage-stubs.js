/* global top, RiseVision, sinon, messageHandlers, config */

/* eslint-disable func-names, no-global-assign */

var messageHandlers = [];

config.TEST_USE_RLS = true;

top.RiseVision = RiseVision || {};
top.RiseVision.Viewer = {};
top.RiseVision.Viewer.LocalMessaging = {
  write: function() {
    // console.log(message);
  },
  receiveMessages: function( action ) {
    messageHandlers.push( function( data ) {
      action( data );
    } );
  },
  canConnect: function() {
    return true;
  }
};

sinon.stub( RiseVision.ImageWatch, "setAdditionalParams", function( params, mode ) {
  ready = true; // eslint-disable-line no-undef

  // spy on log call
  logSpy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" ); // eslint-disable-line no-undef

  RiseVision.ImageWatch.setAdditionalParams.restore();
  // override company id to be the same company from the test data to bypass making direct licensing authorization request
  RiseVision.ImageWatch.setAdditionalParams( params, mode, "30007b45-3df0-4c7b-9f7f-7d8ce6443013", "rls" );
} );
