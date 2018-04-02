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

  return {
    "clearErrorLog": clearErrorLog,
    "getImageElement": getImageElement,
    "getTableName": getTableName,
    "logEvent": logEvent
  };

} )();
