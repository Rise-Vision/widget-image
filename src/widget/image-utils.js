/* global gadgets */

var RiseVision = RiseVision || {};

RiseVision.ImageUtils = ( function() {
  "use strict";

  var ERROR_TIMER_DELAY = 5000,
    _prefs = new gadgets.Prefs(),
    _errorLog = null,
    _errorTimer = null;

  /*
   *  Public  Methods
   */

  function clearErrorLog() {
    _errorLog = null;
  }

  function clearErrorTimer() {
    clearTimeout( _errorTimer );
    _errorTimer = null;
  }

  function startErrorTimer() {
    clearErrorTimer();

    _errorTimer = setTimeout( function() {
      sendDoneToViewer();
    }, ERROR_TIMER_DELAY );
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

  function sendDoneToViewer() {
    gadgets.rpc.call( "", "rsevent_done", null, _prefs.getString( "id" ) );
  }

  function sendReadyToViewer() {
    gadgets.rpc.call( "", "rsevent_ready", null, _prefs.getString( "id" ),
      true, true, true, true, true );
  }

  return {
    "clearErrorLog": clearErrorLog,
    "clearErrorTimer": clearErrorTimer,
    "startErrorTimer": startErrorTimer,
    "getImageElement": getImageElement,
    "getTableName": getTableName,
    "logEvent": logEvent,
    "sendDoneToViewer": sendDoneToViewer,
    "sendReadyToViewer": sendReadyToViewer
  };

} )();
