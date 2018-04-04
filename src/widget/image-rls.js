/* global gadgets, _ */
/* eslint-disable no-console */

var RiseVision = RiseVision || {};

RiseVision.ImageRLS = {};

RiseVision.ImageRLS = ( function( gadgets ) {
  "use strict";

  var _mode,
    _displayId,
    _prefs = new gadgets.Prefs(),
    _message = null,
    _imageUtils = RiseVision.ImageUtils,
    _params = null,
    _storage = null,
    _currentFiles = [],
    _configurationType = null,
    _errorFlag = false,
    _viewerPaused = true,
    _configurationLogged = false,
    _unavailableFlag = false,
    _img = null;

  /*
   *  Private Methods
   */
  function _done() {
    _imageUtils.sendDoneToViewer();

    // log "done" event
    // TODO: file_url should be current file
    _imageUtils.logEvent( { "event": "done", "file_url": null }, false );
  }

  function _init() {
    var container = document.getElementById( "container" ),
      fragment = document.createDocumentFragment(),
      el = document.createElement( "div" );

    // create instance of message
    _message = new RiseVision.Image.Message( document.getElementById( "container" ),
      document.getElementById( "messageContainer" ) );

    // show wait message
    _message.show( "Please wait while your image is downloaded." );

    // legacy
    if ( _params.background && Object.keys( _params.background ).length > 0 ) {
      document.body.style.background = _params.background.color;
    }

    if ( _mode === "file" ) {
      // create the image <div> within the container <div>
      el = _imageUtils.getImageElement( _params );
      fragment.appendChild( el );
      container.appendChild( fragment );

      _img = new Image();

      _configurationType = "storage file";

      // create and initialize the Storage file instance
      _storage = new RiseVision.ImageRLS.PlayerLocalStorageFile( _params, _displayId );
      _storage.init();
    } else if ( _mode === "folder" ) {
      // TODO: coming soon
    }

    _imageUtils.sendReadyToViewer();
  }

  function setSingleImage( url ) {
    _img.onload = function() {
      _imageUtils.handleSingleImageLoad( url, _viewerPaused );
    };

    _img.onerror = function() {
      _imageUtils.handleSingleImageLoadError( url )
    };

    _img.src = url;
  }

  /*
   *  Public Methods
   */
  function onFileInit( urls ) {
    if ( _mode === "file" ) {
      // urls value will be a string of one url
      _currentFiles[ 0 ] = urls;

      _unavailableFlag = false;

      // remove message previously shown
      _message.hide();

      setSingleImage( _currentFiles[ 0 ] );
    }
  }

  function onFileRefresh( urls ) {
    if ( _mode === "file" ) {
      // urls value will be a string of one url
      _currentFiles[ 0 ] = urls;

      if ( _unavailableFlag ) {
        // remove the message previously shown
        _message.hide();
      }

      setSingleImage( _currentFiles[ 0 ] );
    }

    _errorFlag = false;
    _unavailableFlag = false;
    _imageUtils.clearErrorLog();
  }

  function onFileUnavailable( message ) {
    _message.show( message );

    if ( !_viewerPaused ) {
      _done();
    }
  }

  function setAdditionalParams( additionalParams, modeType, displayId ) {
    _params = _.clone( additionalParams );
    _mode = modeType;
    _displayId = displayId;

    _params.width = _prefs.getInt( "rsW" );
    _params.height = _prefs.getInt( "rsH" );

    document.getElementById( "container" ).style.height = _prefs.getInt( "rsH" ) + "px";
    _init();
  }

  function pause() {
    var image = document.querySelector( "#container #image" );

    _viewerPaused = true;

    // in case error timer still running (no conditional check on errorFlag, it may have been reset in onFileRefresh)
    _imageUtils.clearErrorTimer();

    // TODO: handle folder
    if ( _mode === "file" && image && _imageUtils.isSingleImageGIF() ) {
      image.style.visibility = "hidden";
    }
  }

  function play() {
    var image = document.querySelector( "#container #image" );

    _viewerPaused = false;

    if ( !_configurationLogged ) {
      _imageUtils.logEvent( { "event": "configuration", "event_details": _configurationType }, false );
      _configurationLogged = true;
    }

    // TODO: file_url should be current file
    _imageUtils.logEvent( { "event": "play", "file_url": null }, false );

    if ( _errorFlag ) {
      _imageUtils.startErrorTimer();
      return;
    }

    if ( _unavailableFlag ) {
      if ( _mode === "file" && _storage ) {
        _storage.retry();
      }

      return;
    }

    // TODO: handle folder
    if ( _mode === "file" && image && _imageUtils.isSingleImageGIF() ) {
      image.style.visibility = "visible";
    }
  }

  function showError( message ) {
    _errorFlag = true;

    _message.show( message );

    // TODO: handle folder

    if ( !_viewerPaused ) {
      _imageUtils.startErrorTimer();
    }
  }

  function stop() {
    pause();
  }

  return {
    "onFileInit": onFileInit,
    "onFileRefresh": onFileRefresh,
    "onFileUnavailable": onFileUnavailable,
    "pause": pause,
    "play": play,
    "setAdditionalParams": setAdditionalParams,
    "showError": showError,
    "stop": stop
  };
} )( gadgets );
