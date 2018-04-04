/* global gadgets */

var RiseVision = RiseVision || {};

RiseVision.ImageUtils = ( function() {
  "use strict";

  var ERROR_TIMER_DELAY = 5000,
    _prefs = new gadgets.Prefs(),
    _errorLog = null,
    _errorTimer = null,
    _isSingleImageGIF = false;

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

  function startErrorTimer( currentFile ) {
    clearErrorTimer();

    _errorTimer = setTimeout( function() {
      sendDoneToViewer();
      logEvent( { "event": "done", "file_url": currentFile }, false );
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

  function handleSingleImageLoad( url, isViewerPaused, replaceSingleQuote ) {
    var image = document.querySelector( "#container #image" );

    image.style.backgroundImage = "none";

    if ( replaceSingleQuote ) {
      // handles single quotes
      image.style.backgroundImage = "url('" + url.replace( "'", "\\'" ) + "')";
    } else {
      image.style.backgroundImage = "url('" + url + "')";
    }

    _isSingleImageGIF = url.indexOf( ".gif" ) !== -1;

    // If widget is playing right now make sure the div image element is visible
    if ( !isViewerPaused && _isSingleImageGIF ) {
      image.style.visibility = "visible";
    }
  }

  function handleSingleImageLoadError( url ) {
    logEvent( {
      "event": "error",
      "event_details": "image load error",
      "file_url": url
    }, true );
  }

  function isSingleImageGIF() {
    return _isSingleImageGIF;
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
    "handleSingleImageLoad": handleSingleImageLoad,
    "handleSingleImageLoadError": handleSingleImageLoadError,
    "isSingleImageGIF": isSingleImageGIF,
    "getImageElement": getImageElement,
    "getTableName": getTableName,
    "logEvent": logEvent,
    "sendDoneToViewer": sendDoneToViewer,
    "sendReadyToViewer": sendReadyToViewer
  };

} )();
