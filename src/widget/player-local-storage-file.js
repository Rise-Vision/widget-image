/* global localMessaging, playerLocalStorage */
/* eslint-disable no-console */

var RiseVision = RiseVision || {};

RiseVision.ImageRLS = RiseVision.ImageRLS || {};

RiseVision.ImageRLS.PlayerLocalStorageFile = function( params ) {
  "use strict";

  var INITIAL_PROCESSING_DELAY = 10000,
    imageUtils = RiseVision.ImageUtils,
    messaging = new localMessaging.default(),
    storage = null,
    initialProcessingTimer = null,
    watchInitiated = false,
    initialLoad = true;

  function _clearInitialProcessingTimer() {
    clearTimeout( initialProcessingTimer );
    initialProcessingTimer = null;
  }

  function _startInitialProcessingTimer() {
    _clearInitialProcessingTimer();

    initialProcessingTimer = setTimeout( function() {

    }, INITIAL_PROCESSING_DELAY );
  }

  function _getStoragePath() {
    var path = "";

    if ( params.storage.folder ) {
      path += params.storage.folder + ( params.storage.folder.slice( -1 ) !== "/" ? "/" : "" );
    }

    path += params.storage.fileName;

    return "risemedialibrary-" + params.storage.companyId + "/" + path;
  }

  function _getSingleFileURL() {
    return "https://storage.googleapis.com/" + encodeURIComponent( _getStoragePath() );
  }

  function _handleAuthorized() {
    imageUtils.logEvent( {
      "event": "authorized"
    } );

    if ( !watchInitiated ) {
      storage.watchFiles( _getSingleFileURL() );
      watchInitiated = true;
    }
  }

  function _handleFileProcessing() {
    if ( initialLoad ) {
      //RiseVision.Image.onFileUnavailable( "File is downloading" );
      _startInitialProcessingTimer();
    } else {
      _clearInitialProcessingTimer();

    }
  }

  function _handleFileAvailable() {}

  function _handleEvents( data ) {
    if ( !data || !data.event || typeof data.event !== "string" ) {
      return;
    }

    switch ( data.event.toUpperCase() ) {
    case "NO-CONNECTION":
      imageUtils.logEvent( {
        "event": "no connection",
        "event_details": "use rise cache"
      } );
      break;
    case "REQUIRED-MODULES-UNAVAILABLE":
      imageUtils.logEvent( {
        "event": "required modules unavailable"
      } );
      break;
    case "AUTHORIZED":
      _handleAuthorized();
      break;
    case "UNAUTHORIZED":
      imageUtils.logEvent( {
        "event": "unauthorized"
      } );
      break;
    case "FILE-AVAILABLE":
      _handleFileAvailable( data );
      break;
    case "FILE-PROCESSING":
      _handleFileProcessing();
      break;
    case "FILE-NO-EXIST":
      //
      break;
    case "FILE-DELETED":
      //
      break;
    case "FILE-ERROR":
      //
      break;
    }
  }

  function init() {
    storage = new playerLocalStorage.default( messaging, _handleEvents );
  }

  return {
    "init": init
  };
};
