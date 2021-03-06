/* global gadgets */

var RiseVision = RiseVision || {};

RiseVision.ImageUtils = ( function() {
  "use strict";

  var _prefs = new gadgets.Prefs(),
    _params = null,
    _mode = null,
    _configurationType = null,
    _usingWatch = false,
    _watchType = null,
    _isSingleImageGIF = false;

  /*
   *  Public  Methods
   */

  function convertSVGToDataURL( filePath, localUrl, callback ) {
    var xhr = new XMLHttpRequest();

    function handleFailure( type ) {
      var debugInfo = {
        event_details: type,
        file_url: filePath,
        local_url: localUrl
      };

      logEvent( {
        event: "error",
        event_details: debugInfo.event_details,
        file_url: debugInfo.file_url,
        local_url: debugInfo.local_url
      }, { severity: "error", errorCode: "E000000012", debugInfo: JSON.stringify( debugInfo ) } );

      callback( null );
    }

    if ( !callback || typeof callback !== "function" ) {
      return;
    }

    xhr.overrideMimeType( "image/svg+xml" );

    xhr.onload = function() {
      var reader = new FileReader();

      reader.onloadend = function() {
        if ( reader.error ) {
          handleFailure( "svg read error" );
          return;
        }

        logEvent( {
          event: "info",
          event_details: JSON.stringify( {
            type: "svg file",
            blob_size: xhr.response.size,
            data_url_length: reader.result.length
          } ),
          file_url: filePath,
          local_url: localUrl
        } );

        callback( reader.result );
      };

      reader.readAsDataURL( xhr.response );
    };

    xhr.onerror = function() {
      handleFailure( "svg xhr error" );
    };

    xhr.open( "GET", localUrl );
    xhr.responseType = "blob";
    xhr.send();
  }

  function getConfigurationType() {
    return _configurationType;
  }

  function getStorageFileName( filePath ) {
    if ( !filePath || typeof filePath !== "string" ) {
      return "";
    }

    return filePath.split( "risemedialibrary-" ).pop().split( "/" ).pop();
  }

  function getStorageSingleFilePath() {
    var path = "";

    if ( _params.storage.folder ) {
      path += _params.storage.folder + ( _params.storage.folder.slice( -1 ) !== "/" ? "/" : "" );
    }

    path += _params.storage.fileName;

    return "risemedialibrary-" + _params.storage.companyId + "/" + path;
  }

  function getStorageFolderPath() {
    var path = "";

    path += _params.storage.folder + ( _params.storage.folder.slice( -1 ) !== "/" ? "/" : "" );

    return "risemedialibrary-" + _params.storage.companyId + "/" + path;
  }

  function getImageElement( params ) {
    var el = document.createElement( "div" );

    el.setAttribute( "id", "image" );
    el.className = params.position;
    el.className = params.scaleToFit ? el.className + " scale-to-fit" : el.className;

    return el;
  }

  function getMode() {
    return _mode;
  }

  function getParams() {
    return _params;
  }

  function getTableName() {
    return "image_events";
  }

  function handleSingleImageLoad( url, isViewerPaused ) {
    var image = document.querySelector( "#container #image" );

    image.style.backgroundImage = "none";
    image.style.backgroundImage = "url('" + url + "')";

    setSingleImageGIF( url.indexOf( ".gif" ) !== -1 );

    // If widget is playing right now make sure the div image element is visible
    if ( !isViewerPaused && _isSingleImageGIF ) {
      image.style.visibility = "visible";
    }
  }

  function handleSingleImageLoadError( url ) {
    var params = {
        "event": "error",
        "event_details": "image load error"
      },
      errorCode = "E000000200";

    if ( _usingWatch ) {
      params.file_url = RiseVision.ImageUtils.getStorageSingleFilePath();
      params.local_url = url;
    } else {
      params.file_url = url;
      errorCode = _configurationType === "custom" ? "E000000210" : "E000000011";
    }

    logEvent( params, { severity: "error", errorCode: errorCode, debugInfo: JSON.stringify( params ) } );
  }

  function handleSingleImageDeletion() {
    var image = document.querySelector( "#container #image" );

    image.style.backgroundImage = "none";
    image.style.visibility = "visible";

    setSingleImageGIF( false );
  }

  function setSingleImageGIF( status ) {
    _isSingleImageGIF = status;
  }

  function isSingleImageGIF() {
    return _isSingleImageGIF;
  }

  function isSVGImage( filePath ) {
    if ( !filePath || typeof filePath !== "string" ) {
      return false;
    }

    return filePath.toLowerCase().split( "." ).pop().split( /\#|\?/ )[ 0 ] === "svg";
  }

  function getUsingWatch() {
    return _usingWatch;
  }

  function getWatchType() {
    return _watchType;
  }

  function logEvent( data, endpointLoggingFields ) {
    data.configuration = getConfigurationType() || "";

    if ( endpointLoggingFields ) {
      endpointLoggingFields.eventApp = "widget-image";
    }

    RiseVision.Common.LoggerUtils.logEvent( getTableName(), data, endpointLoggingFields );
  }

  function sendDoneToViewer() {
    gadgets.rpc.call( "", "rsevent_done", null, _prefs.getString( "id" ) );
  }

  function sendReadyToViewer() {
    gadgets.rpc.call( "", "rsevent_ready", null, _prefs.getString( "id" ),
      true, true, true, true, true );
  }

  function setConfigurationType( type ) {
    _configurationType = type;
  }

  function setMode( mode ) {
    _mode = mode;
  }

  function setParams( params ) {
    _params = params;
  }

  function setUsingWatch( watchType ) {
    _usingWatch = true;
    _watchType = watchType;
  }

  return {
    "convertSVGToDataURL": convertSVGToDataURL,
    "getConfigurationType": getConfigurationType,
    "getMode": getMode,
    "getParams": getParams,
    "handleSingleImageDeletion": handleSingleImageDeletion,
    "handleSingleImageLoad": handleSingleImageLoad,
    "handleSingleImageLoadError": handleSingleImageLoadError,
    "setSingleImageGIF": setSingleImageGIF,
    "isSingleImageGIF": isSingleImageGIF,
    "isSVGImage": isSVGImage,
    "getUsingWatch": getUsingWatch,
    "getWatchType": getWatchType,
    "getImageElement": getImageElement,
    "getStorageFileName": getStorageFileName,
    "getStorageSingleFilePath": getStorageSingleFilePath,
    "getStorageFolderPath": getStorageFolderPath,
    "getTableName": getTableName,
    "logEvent": logEvent,
    "setConfigurationType": setConfigurationType,
    "sendDoneToViewer": sendDoneToViewer,
    "sendReadyToViewer": sendReadyToViewer,
    "setMode": setMode,
    "setParams": setParams,
    "setUsingWatch": setUsingWatch
  };

} )();
