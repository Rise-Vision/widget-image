/* global gadgets, _ */

var RiseVision = RiseVision || {};

RiseVision.Image = {};

RiseVision.Image = ( function( gadgets ) {
  "use strict";

  var _mode,
    _displayId,
    _prefs = new gadgets.Prefs(),
    _message = null,
    _imageUtils = RiseVision.ImageUtils,
    _params = null,
    _storage = null,
    _nonStorage = null,
    _slider = null,
    _currentFiles = [],
    _configurationType = null,
    _errorFlag = false,
    _storageErrorFlag = false,
    _configurationLogged = false,
    _unavailableFlag = false,
    _viewerPaused = true,
    _img = null;

  /*
   *  Private Methods
   */
  function _done() {
    _imageUtils.sendDoneToViewer();
  }

  function init() {
    var container = document.getElementById( "container" ),
      fragment = document.createDocumentFragment(),
      el = document.createElement( "div" ),
      isStorageFile;

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

      isStorageFile = ( Object.keys( _params.storage ).length !== 0 );

      if ( !isStorageFile ) {
        _configurationType = "custom";

        _nonStorage = new RiseVision.Image.NonStorage( _params );
        _nonStorage.init();
      } else {
        _configurationType = "storage file";

        // create and initialize the Storage file instance
        _storage = new RiseVision.Image.StorageFile( _params, _displayId );
        _storage.init();
      }
    } else if ( _mode === "folder" ) {
      // create the slider container <div> within the container <div>
      el.className = "tp-banner-container";

      fragment.appendChild( el );
      container.appendChild( fragment );

      _configurationType = "storage folder";

      // create and initialize the Storage folder instance
      _storage = new RiseVision.Image.StorageFolder( _params, _displayId );
      _storage.init();
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

    // handles special characters
    _img.src = url.replace( "\\'", "'" );
  }

  /*
   *  Public Methods
   */
  function hasStorageError() {
    return _storageErrorFlag;
  }

  function onFileInit( urls ) {
    if ( _mode === "file" ) {
      // urls value will be a string
      _currentFiles[ 0 ] = urls;

      _unavailableFlag = false;

      // remove a message previously shown
      _message.hide();

      setSingleImage( _currentFiles[ 0 ] );

    } else if ( _mode === "folder" ) {
      // urls value will be an array
      _currentFiles = urls;

      // create slider instance
      _slider = new RiseVision.Image.Slider( _params );
      _slider.init( urls );
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

    } else if ( _mode === "folder" ) {
      // urls value will be an array of urls
      _currentFiles = urls;

      _slider.refresh( _currentFiles );
    }

    // in case refreshed file fixes an error with previous file, ensure flag is removed so playback is attempted again
    _errorFlag = false;
    _storageErrorFlag = false;
    _unavailableFlag = false;
  }

  function onFileUnavailable( message ) {
    _unavailableFlag = true;

    _message.show( message );

    // if Widget is playing right now, run the timer
    if ( !_viewerPaused ) {
      _imageUtils.startErrorTimer();
    }
  }

  function setAdditionalParams( additionalParams, modeType, displayId ) {
    _params = _.clone( additionalParams );
    _mode = modeType;
    _displayId = displayId;

    _params.width = _prefs.getInt( "rsW" );
    _params.height = _prefs.getInt( "rsH" );

    document.getElementById( "container" ).style.height = _prefs.getInt( "rsH" ) + "px";
    init();
  }

  function onSliderReady() {
    _message.hide();

    if ( !_viewerPaused ) {
      _slider.play();
    }
  }

  function onSliderComplete() {
    _done();
  }

  function pause() {
    var image = document.querySelector( "#container #image" );

    _viewerPaused = true;

    // in case error timer still running (no conditional check on errorFlag, it may have been reset in onFileRefresh)
    _imageUtils.clearErrorTimer();

    if ( _mode === "folder" && _slider && _slider.isReady() ) {
      _slider.pause();
    } else if ( _mode === "file" && image && _imageUtils.isSingleImageGIF() ) {
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

    if ( _mode === "folder" && _slider && _slider.isReady() ) {
      _slider.play();
    } else if ( _mode === "file" && image && _imageUtils.isSingleImageGIF() ) {
      image.style.visibility = "visible";
    }
  }

  function showError( message, isStorageError ) {
    _errorFlag = true;
    _storageErrorFlag = typeof isStorageError !== "undefined";

    _message.show( message );

    // destroy slider if it exists and previously notified ready
    if ( _mode === "folder" && _slider && _slider.isReady() ) {
      _slider.destroy();
    }

    if ( !_viewerPaused ) {
      _imageUtils.startErrorTimer();
    }
  }

  function stop() {
    pause();
  }

  return {
    "hasStorageError": hasStorageError,
    "onFileInit": onFileInit,
    "onFileRefresh": onFileRefresh,
    "onFileUnavailable": onFileUnavailable,
    "onSliderComplete": onSliderComplete,
    "onSliderReady": onSliderReady,
    "pause": pause,
    "play": play,
    "setAdditionalParams": setAdditionalParams,
    "showError": showError,
    "stop": stop
  };
} )( gadgets );
