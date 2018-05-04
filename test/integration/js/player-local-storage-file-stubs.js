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

sinon.stub( RiseVision.ImageRLS, "setAdditionalParams", function( params, mode, displayId ) {
  ready = true; // eslint-disable-line no-undef

  // spy on log call
  logSpy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" ); // eslint-disable-line no-undef

  RiseVision.ImageRLS.setAdditionalParams.restore();
  RiseVision.ImageRLS.setAdditionalParams( params, mode, displayId );
} );
