/* global gadgets */

var RiseVision = RiseVision || {};

RiseVision.ImageUtils = ( function() {
  "use strict";

  var ERROR_TIMER_DELAY = 5000,
    _prefs = new gadgets.Prefs(),
    _params = null,
    _mode = null,
    _configurationType = null,
    _usingRLS = false,
    _errorTimer = null,
    _isSingleImageGIF = false;

  /*
   *  Public  Methods
   */

  function clearErrorTimer() {
    clearTimeout( _errorTimer );
    _errorTimer = null;
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

  function startErrorTimer() {
    clearErrorTimer();

    _errorTimer = setTimeout( function() {
      RiseVision.ImageUtils.sendDoneToViewer();
    }, ERROR_TIMER_DELAY );
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

    _isSingleImageGIF = url.indexOf( ".gif" ) !== -1;

    // If widget is playing right now make sure the div image element is visible
    if ( !isViewerPaused && _isSingleImageGIF ) {
      image.style.visibility = "visible";
    }
  }

  function handleSingleImageLoadError( url ) {
    var params = {
      "event": "error",
      "event_details": "image load error"
    };

    if ( _usingRLS ) {
      params.file_url = RiseVision.ImageUtils.getStorageSingleFilePath();
      params.local_url = url;
    } else {
      params.file_url = url;
    }

    logEvent( params );
  }

  function isSingleImageGIF() {
    return _isSingleImageGIF;
  }

  function logEvent( data ) {
    data.configuration = getConfigurationType() || "";
    RiseVision.Common.LoggerUtils.logEvent( getTableName(), data );
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

  function setUsingRLS() {
    _usingRLS = true;
  }

  return {
    "clearErrorTimer": clearErrorTimer,
    "getConfigurationType": getConfigurationType,
    "getMode": getMode,
    "getParams": getParams,
    "startErrorTimer": startErrorTimer,
    "handleSingleImageLoad": handleSingleImageLoad,
    "handleSingleImageLoadError": handleSingleImageLoadError,
    "isSingleImageGIF": isSingleImageGIF,
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
    "setUsingRLS": setUsingRLS
  };

} )();
