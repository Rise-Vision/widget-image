/* global localMessaging, playerLocalStorage */
/* eslint-disable no-console */

var RiseVision = RiseVision || {};

RiseVision.Image = RiseVision.Image || {};

RiseVision.Image.PlayerLocalStorageFile = function() {
  "use strict";

  var wsClient = new localMessaging.default(),
    storage = null; // eslint-disable-line no-unused-vars

  function _handleEvents( data ) {
    if ( !data || !data.event || typeof data.event !== "string" ) {
      return;
    }

    switch ( data.event.toUpperCase() ) {
    case "NO-CONNECTION":
      RiseVision.Image.logEvent( {
        "event": "no connection",
        "event_details": "use rise cache"
      } );
      break;
    case "REQUIRED-MODULES-UNAVAILABLE":
      RiseVision.Image.logEvent( {
        "event": "required modules unavailable"
      } );
      break;
    case "AUTHORIZED":
      RiseVision.Image.logEvent( {
        "event": "authorized"
      } );
      break;
    case "UNAUTHORIZED":
      RiseVision.Image.logEvent( {
        "event": "unauthorized"
      } );
      break;
    }
  }

  function init() {
    storage = new playerLocalStorage.default( wsClient, _handleEvents );
  }

  return {
    "init": init
  };
};
