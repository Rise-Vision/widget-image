/* global localMessaging, playerLocalStorage, playerLocalStorageLicensing, config _ */
/* eslint-disable no-console */

var RiseVision = RiseVision || {};

RiseVision.ImageWatch = RiseVision.ImageWatch || {};

RiseVision.ImageWatch.PlayerLocalStorageFile = function() {
  "use strict";

  var INITIAL_PROCESSING_DELAY = 10000,
    imageUtils = RiseVision.ImageUtils,
    messaging = new localMessaging.default(),
    filePath = "",
    licensing = null,
    storage = null,
    initialProcessingTimer = null,
    watchInitiated = false,
    initialLoad = true,
    fileErrorLogParams = null;

  function _clearInitialProcessingTimer() {
    clearTimeout( initialProcessingTimer );
    initialProcessingTimer = null;
  }

  function _startInitialProcessingTimer() {
    initialProcessingTimer = setTimeout( function() {
      // file is still processing/downloading
      RiseVision.ImageWatch.onFileUnavailable( "File is downloading." );
    }, INITIAL_PROCESSING_DELAY );
  }

  function _resetFileErrorLogParams() {
    fileErrorLogParams = null;
  }

  function _handleNoConnection() {
    imageUtils.logEvent( {
      "event": "error",
      "event_details": "no connection",
      "file_url": filePath
    }, { severity: "error", errorCode: "E000000025", debugInfo: filePath } );

    RiseVision.ImageWatch.handleError();
  }

  function _handleRequiredModulesUnavailable() {
    imageUtils.logEvent( {
      "event": "error",
      "event_details": "required modules unavailable",
      "file_url": filePath
    }, { severity: "error", errorCode: "E000000025", debugInfo: filePath } );

    RiseVision.ImageWatch.handleError();
  }

  function _handleUnauthorized() {
    imageUtils.logEvent( {
      "event": "error",
      "event_details": "unauthorized",
      "file_url": filePath
    }, { severity: "error", errorCode: "E000000016", debugInfo: JSON.stringify( { event_details: "unauthorized", file_url: filePath } ) } );

    RiseVision.ImageWatch.handleError();
  }

  function _handleAuthorized() {
    if ( !watchInitiated ) {
      // start watching the file
      storage.watchFiles( filePath );
      watchInitiated = true;
    }
  }

  function _handleAuthorizationError( data ) {
    var detail = data.detail || "";

    imageUtils.logEvent( {
      "event": "error",
      "event_details": "authorization error",
      "error_details": ( typeof detail === "string" ) ? detail : JSON.stringify( detail ),
      "file_url": filePath
    }, { severity: "error", errorCode: "E000000016", debugInfo: JSON.stringify( { event_details: "authorization error", error_details: detail, file_url: filePath } ) } );
  }

  function _handleFileProcessing() {
    _resetFileErrorLogParams();

    if ( initialLoad && !initialProcessingTimer ) {
      _startInitialProcessingTimer();
    }
  }

  function _handleFileAvailable( data ) {
    _clearInitialProcessingTimer();
    _resetFileErrorLogParams();

    if ( initialLoad ) {
      initialLoad = false;
      RiseVision.ImageWatch.onFileInit( data.fileUrl );

      return;
    }

    RiseVision.ImageWatch.onFileRefresh( data.fileUrl );
  }

  function _handleFileNoExist( data ) {
    var params = {
      "event": "error",
      "event_details": "file does not exist",
      "file_url": data.filePath
    };

    imageUtils.logEvent( params, { severity: "error", errorCode: "E000000014", debugInfo: data.filePath } );

    RiseVision.ImageWatch.handleError();
  }

  function _handleFileDeleted( data ) {
    imageUtils.logEvent( {
      "event": "file deleted",
      "file_url": data.filePath
    }, { severity: "info", debugInfo: data.filePath } );

    RiseVision.ImageWatch.onFileDeleted();
  }

  function _handleFileError( data ) {
    var msg = data.msg || "",
      detail = data.detail || "",
      params = {
        "event": "error",
        "event_details": msg,
        "error_details": JSON.stringify( {
          watchType: "rise-local-storage",
          file_url: data.filePath,
          detail: detail
        } ),
        "file_url": data.filePath
      },
      errorCode = msg && msg.toLowerCase().includes( "insufficient disk space" ) ? "E000000040" : "E000000027";

    // prevent repetitive logging when widget is receiving messages from other potential widget instances watching same file
    if ( _.isEqual( params, fileErrorLogParams ) ) {
      return;
    }

    fileErrorLogParams = _.clone( params );

    imageUtils.logEvent( params, { severity: "error", errorCode: errorCode } );

    /*** Possible error messages from Local Storage ***/
    /*
      "File's host server could not be reached"

      "File I/O Error"

      "Could not retrieve signed URL"

      "Insufficient disk space"

      "Invalid response with status code [CODE]"
     */

    RiseVision.ImageWatch.handleError();
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
    case "AUTHORIZATION-ERROR":
      _handleAuthorizationError;
      break;
    case "FILE-AVAILABLE":
      _handleFileAvailable( data );
      break;
    case "FILE-PROCESSING":
      _handleFileProcessing();
      break;
    case "FILE-NO-EXIST":
      _handleFileNoExist( data );
      break;
    case "FILE-DELETED":
      _handleFileDeleted( data );
      break;
    case "FILE-ERROR":
      _handleFileError( data );
      break;
    }
  }

  function init() {
    var params = imageUtils.getParams(),
      companyId = ( params.storage.companyId !== params.companyId ) ? params.storage.companyId : "";

    filePath = imageUtils.getStorageSingleFilePath();
    licensing = new playerLocalStorageLicensing.default( messaging, _handleEvents, companyId, config.STORAGE_ENV );
    storage = new playerLocalStorage.default( messaging, licensing, _handleEvents );
  }

  function retry() {
    _handleFileProcessing();
  }

  return {
    "init": init,
    "retry": retry
  };
};
