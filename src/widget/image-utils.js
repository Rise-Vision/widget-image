/* global gadgets */

var RiseVision = RiseVision || {};

RiseVision.ImageUtils = ( function() {
  "use strict";

  var _errorLog = null;

  /*
   *  Public  Methods
   */

  function clearErrorLog() {
    _errorLog = null;
  }

  function getImageElement( params ) {
    var el = document.createElement( "div" );

    el.setAttribute( "id", "image" );
    el.className = params.position;
    el.className = params.scaleToFit ? el.className + " scale-to-fit" : el.className;

    return el;
  }

  function getTableName() {
    return "image_events";
  }

  function logEvent( params, isError ) {
    if ( isError ) {
      _errorLog = params;
    }

    if ( params.event === "done" ) {
      // Any errors need to be logged before the done event.
      if ( _errorLog ) {
        RiseVision.Common.LoggerUtils.logEvent( getTableName(), _errorLog );
      }
    }

    RiseVision.Common.LoggerUtils.logEvent( getTableName(), params );
  }

  function sendDoneToViewer( prefs ) {
    gadgets.rpc.call( "", "rsevent_done", null, prefs.getString( "id" ) );
  }

  function sendReadyToViewer( prefs ) {
    gadgets.rpc.call( "", "rsevent_ready", null, prefs.getString( "id" ),
      true, true, true, true, true );
  }

  return {
    "clearErrorLog": clearErrorLog,
    "getImageElement": getImageElement,
    "getTableName": getTableName,
    "logEvent": logEvent,
    "sendDoneToViewer": sendDoneToViewer,
    "sendReadyToViewer": sendReadyToViewer
  };

} )();
