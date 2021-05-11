/* global riseContentSentinel, _ */
/* eslint-disable no-console */

var RiseVision = RiseVision || {};

RiseVision.ImageWatch = RiseVision.ImageWatch || {};

RiseVision.ImageWatch.RiseContentSentinelFile = function() {
  "use strict";

  var INITIAL_PROCESSING_DELAY = 10000,
    imageUtils = RiseVision.ImageUtils,
    filePath = "",
    contentSentinel = null,
    initialProcessingTimer = null,
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
      "event": "info",
      "event_details": "file deleted",
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
          watchType: "rise-content-sentinel",
          file_url: data.filePath,
          detail: detail
        } ),
        "file_url": data.filePath
      },
      errorCode = msg && msg.toLowerCase().includes( "insufficient quota" ) ? "E000000040" : "E000000215";

    // prevent repetitive logging when widget is receiving messages from other potential widget instances watching same file
    if ( _.isEqual( params, fileErrorLogParams ) ) {
      return;
    }

    fileErrorLogParams = _.clone( params );
    imageUtils.logEvent( params, { severity: "error", errorCode: errorCode } );

    RiseVision.ImageWatch.handleError();
  }

  function _handleEvents( data ) {
    if ( !data || !data.event || typeof data.event !== "string" ) {
      return;
    }

    switch ( data.event.toUpperCase() ) {
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
    filePath = imageUtils.getStorageSingleFilePath();
    contentSentinel = new riseContentSentinel.default( _handleEvents );

    // start watching the file
    contentSentinel.watchFiles( filePath );
  }

  function retry() {
    _handleFileProcessing();
  }

  return {
    "init": init,
    "retry": retry
  };
};
