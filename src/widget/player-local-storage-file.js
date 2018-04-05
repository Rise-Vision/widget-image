/* global localMessaging, playerLocalStorage */
/* eslint-disable no-console */

var RiseVision = RiseVision || {};

RiseVision.ImageRLS = RiseVision.ImageRLS || {};

RiseVision.ImageRLS.PlayerLocalStorageFile = function( params ) {
  "use strict";

  var INITIAL_PROCESSING_DELAY = 10000,
    imageUtils = RiseVision.ImageUtils,
    messaging = new localMessaging.default(),
    filePath = "",
    storage = null,
    initialProcessingTimer = null,
    watchInitiated = false,
    initialLoad = true;

  function _clearInitialProcessingTimer() {
    clearTimeout( initialProcessingTimer );
    initialProcessingTimer = null;
  }

  function _startInitialProcessingTimer() {
    initialProcessingTimer = setTimeout( function() {
      // file is still processing/downloading
      RiseVision.ImageRLS.onFileUnavailable( "File is downloading" );
    }, INITIAL_PROCESSING_DELAY );
  }

  function _getFilePath() {
    var path = "";

    if ( params.storage.folder ) {
      path += params.storage.folder + ( params.storage.folder.slice( -1 ) !== "/" ? "/" : "" );
    }

    path += params.storage.fileName;

    return "risemedialibrary-" + params.storage.companyId + "/" + path;
  }

  function _handleNoConnection() {
    imageUtils.logEvent( {
      "event": "error",
      "event_details": "no connection",
      "file_url": filePath
    }, true );

    RiseVision.ImageRLS.showError( "There was a problem retrieving the file." );
  }

  function _handleRequiredModulesUnavailable() {
    imageUtils.logEvent( {
      "event": "error",
      "event_details": "required modules unavailable",
      "file_url": filePath
    }, true );

    RiseVision.ImageRLS.showError( "There was a problem retrieving the file." );
  }

  function _handleUnauthorized() {
    imageUtils.logEvent( {
      "event": "error",
      "event_details": "unauthorized",
      "file_url": filePath
    }, true );

    RiseVision.ImageRLS.showError( "Rise Storage subscription is not active." );
  }

  function _handleAuthorized() {
    if ( !watchInitiated ) {
      // start watching the file
      storage.watchFiles( filePath );
      watchInitiated = true;
    }
  }

  function _handleFileProcessing() {
    if ( initialLoad && !initialProcessingTimer ) {
      _startInitialProcessingTimer();
    }
  }

  function _handleFileAvailable( data ) {
    _clearInitialProcessingTimer();

    if ( initialLoad ) {
      initialLoad = false;
      RiseVision.ImageRLS.onFileInit( data.fileUrl );

      return;
    }

    RiseVision.ImageRLS.onFileRefresh( data.fileUrl );
  }

  function _handleFileNoExist() {
    var params = {
      "event": "error",
      "event_details": "file does not exist",
      "file_url": filePath
    };

    imageUtils.logEvent( params, true );

    RiseVision.ImageRLS.showError( "The selected image does not exist or has been moved to Trash." );
  }

  function _handleFileDeleted() {
    imageUtils.logEvent( {
      "event": "file deleted",
      "file_url": filePath
    } );
  }

  function _handleFileError( data ) {
    var msg = data.msg || "",
      detail = data.detail || "",
      params = {
        "event": "error",
        "event_details": msg,
        "error_details": detail,
        "file_url": filePath
      };

    imageUtils.logEvent( params, true );

    /*** Possible error messages from Local Storage ***/
    /*
      "File's host server could not be reached"

      "File I/O Error"

      "Could not retrieve signed URL"

      "Insufficient disk space"

      "Invalid response with status code [CODE]"
     */

    // Widget will display generic message
    RiseVision.ImageRLS.showError( "Unable to download the file." );
  }

  function _handleEvents( data ) {
    if ( !data || !data.event || typeof data.event !== "string" ) {
      return;
    }

    switch ( data.event.toUpperCase() ) {
    case "NO-CONNECTION":
      _handleNoConnection();
      break;
    case "REQUIRED-MODULES-UNAVAILABLE":
      _handleRequiredModulesUnavailable();
      break;
    case "AUTHORIZED":
      _handleAuthorized();
      break;
    case "UNAUTHORIZED":
      _handleUnauthorized();
      break;
    case "FILE-AVAILABLE":
      _handleFileAvailable( data );
      break;
    case "FILE-PROCESSING":
      _handleFileProcessing();
      break;
    case "FILE-NO-EXIST":
      _handleFileNoExist();
      break;
    case "FILE-DELETED":
      _handleFileDeleted();
      break;
    case "FILE-ERROR":
      _handleFileError( data );
      break;
    }
  }

  function getFilePath() {
    return filePath;
  }

  function init() {
    filePath = _getFilePath();
    storage = new playerLocalStorage.default( messaging, _handleEvents );
  }

  function retry() {
    _handleFileProcessing();
  }

  return {
    "getFilePath": getFilePath,
    "init": init,
    "retry": retry
  };
};
