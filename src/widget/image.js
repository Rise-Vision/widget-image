/* global gadgets, _ */

var RiseVision = RiseVision || {};

RiseVision.Image = {};

RiseVision.Image = ( function( gadgets ) {
  "use strict";

  var _displayId,
    _prefs = new gadgets.Prefs(),
    _message = null,
    _imageUtils = RiseVision.ImageUtils,
    _storage = null,
    _nonStorage = null,
    _slider = null,
    _currentFiles = [],
    _errorFlag = false,
    _storageErrorFlag = false,
    _configurationLogged = false,
    _unavailableFlag = false,
    _viewerPaused = true,
    _img = null;

  /*
   *  Private Methods
   */
  function _logConfiguration( type ) {
    var params = _imageUtils.getParams(),
      configParams = {
        "event": "configuration",
        "event_details": type
      },
      mode = _imageUtils.getMode();

    if ( !_configurationLogged ) {
      if ( mode === "file" ) {
        if ( type !== "custom" ) {
          configParams.file_url = _imageUtils.getStorageSingleFilePath();
        } else {
          configParams.file_url = ( params.url && params.url !== "" ) ? params.url : params.selector.url;
        }
      } else if ( mode === "folder" ) {
        configParams.file_url = _imageUtils.getStorageFolderPath();
        configParams.file_format = "JPG|JPEG|PNG|BMP|SVG|GIF|WEBP";
      }

      _imageUtils.logEvent( configParams );
      _configurationLogged = true;
    }
  }

  function init() {
    var params = _imageUtils.getParams(),
      container = document.getElementById( "container" ),
      fragment = document.createDocumentFragment(),
      el = document.createElement( "div" ),
      isStorageFile;

    // create instance of message
    _message = new RiseVision.Image.Message( document.getElementById( "container" ),
      document.getElementById( "messageContainer" ) );

    // show wait message
    _message.show( "Please wait while your image is downloaded." );

    // legacy
    if ( params.background && Object.keys( params.background ).length > 0 ) {
      document.body.style.background = params.background.color;
    }

    if ( _imageUtils.getMode() === "file" ) {
      // create the image <div> within the container <div>
      el = _imageUtils.getImageElement( params );
      fragment.appendChild( el );
      container.appendChild( fragment );

      _img = new Image();

      isStorageFile = ( Object.keys( params.storage ).length !== 0 );

      if ( !isStorageFile ) {
        _imageUtils.setConfigurationType( "custom" );

        _nonStorage = new RiseVision.Image.NonStorage( params );
        _nonStorage.init();
      } else {
        _imageUtils.setConfigurationType( "storage file" );

        // create and initialize the Storage file instance
        _storage = new RiseVision.Image.StorageFile( params, _displayId );
        _storage.init();
      }
    } else if ( _imageUtils.getMode() === "folder" ) {
      // create the slider container <div> within the container <div>
      el.className = "tp-banner-container";

      fragment.appendChild( el );
      container.appendChild( fragment );

      _imageUtils.setConfigurationType( "storage folder" );

      // create and initialize the Storage folder instance
      _storage = new RiseVision.Image.StorageFolder( params, _displayId );
      _storage.init();
    }

    _logConfiguration( _imageUtils.getConfigurationType() );
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
    if ( _imageUtils.getMode() === "file" ) {
      // urls value will be a string
      _currentFiles[ 0 ] = urls;

      _unavailableFlag = false;

      // remove a message previously shown
      _message.hide();

      setSingleImage( _currentFiles[ 0 ] );

    } else if ( _imageUtils.getMode() === "folder" ) {
      // urls value will be an array
      _currentFiles = urls;

      // create slider instance
      _slider = new RiseVision.Slider( _imageUtils.getParams(), RiseVision.Image );
      _slider.init( urls );
    }
  }

  function onFileRefresh( urls ) {
    if ( _imageUtils.getMode() === "file" ) {
      // urls value will be a string of one url
      _currentFiles[ 0 ] = urls;

      if ( _unavailableFlag ) {
        // remove the message previously shown
        _message.hide();
      }

      setSingleImage( _currentFiles[ 0 ] );

    } else if ( _imageUtils.getMode() === "folder" ) {
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
      _imageUtils.sendDoneToViewer();
    }
  }

  function setAdditionalParams( additionalParams, modeType, displayId ) {
    var data = _.clone( additionalParams );

    _imageUtils.setMode( modeType );
    _displayId = displayId;

    data.width = _prefs.getInt( "rsW" );
    data.height = _prefs.getInt( "rsH" );

    _imageUtils.setParams( data );

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
    _imageUtils.sendDoneToViewer();
  }

  function pause() {
    var image = document.querySelector( "#container #image" );

    _viewerPaused = true;

    if ( _imageUtils.getMode() === "folder" && _slider && _slider.isReady() ) {
      _slider.pause();
    } else if ( _imageUtils.getMode() === "file" && image && _imageUtils.isSingleImageGIF() ) {
      image.style.visibility = "hidden";
    }
  }

  function play() {
    var image = document.querySelector( "#container #image" );

    _viewerPaused = false;

    if ( _errorFlag ) {
      _imageUtils.sendDoneToViewer();
      return;
    }

    if ( _unavailableFlag ) {
      if ( _imageUtils.getMode() === "file" && _storage ) {
        _storage.retry();
      }

      return;
    }

    if ( _imageUtils.getMode() === "folder" && _slider && _slider.isReady() ) {
      _slider.play();
    } else if ( _imageUtils.getMode() === "file" && image && _imageUtils.isSingleImageGIF() ) {
      image.style.visibility = "visible";
    }
  }

  function showError( message, isStorageError ) {
    _errorFlag = true;
    _storageErrorFlag = typeof isStorageError !== "undefined";

    // 22/10/2020 requirement to stop displaying error messages
    // set to a blank message so the image container gets hidden and nothing is displayed on screen
    _message.show( "" );

    // destroy slider if it exists and previously notified ready
    if ( _imageUtils.getMode() === "folder" && _slider && _slider.isReady() ) {
      _slider.destroy();
    }

    if ( !_viewerPaused ) {
      _imageUtils.sendDoneToViewer();
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
