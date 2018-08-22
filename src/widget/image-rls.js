/* global gadgets, _ */
/* eslint-disable no-console */

var RiseVision = RiseVision || {};

RiseVision.ImageRLS = {};

RiseVision.ImageRLS = ( function( gadgets ) {
  "use strict";

  var _prefs = new gadgets.Prefs(),
    _message = null,
    _imageUtils = RiseVision.ImageUtils,
    _storage = null,
    _slider = null,
    _errorFlag = false,
    _viewerPaused = true,
    _configurationLogged = false,
    _unavailableFlag = false,
    _img = null;

  /*
   *  Private Methods
   */
  function _logConfiguration( type ) {
    var configParams = {
        "event": "configuration",
        "event_details": type
      },
      mode = _imageUtils.getMode();

    if ( !_configurationLogged ) {
      if ( mode === "file" ) {
        configParams.file_url = _imageUtils.getStorageSingleFilePath();
      } else if ( mode === "folder" ) {
        configParams.file_url = _imageUtils.getStorageFolderPath();
        configParams.file_format = "JPG|JPEG|PNG|BMP|SVG|GIF|WEBP";
      }

      _imageUtils.logEvent( configParams );
      _configurationLogged = true;
    }
  }

  function _init() {
    var params = _imageUtils.getParams(),
      container = document.getElementById( "container" ),
      fragment = document.createDocumentFragment(),
      el = document.createElement( "div" );

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

      _imageUtils.setConfigurationType( "storage file (rls)" );

      // create and initialize the Storage file instance
      _storage = new RiseVision.ImageRLS.PlayerLocalStorageFile();
    } else if ( _imageUtils.getMode() === "folder" ) {
      // create the slider container <div> within the container <div>
      el.className = "tp-banner-container";

      fragment.appendChild( el );
      container.appendChild( fragment );

      _imageUtils.setConfigurationType( "storage folder (rls)" );

      // create and initialize the Storage folder instance
      _storage = new RiseVision.ImageRLS.PlayerLocalStorageFolder();
    }

    _storage.init();
    _logConfiguration( _imageUtils.getConfigurationType() );
    _imageUtils.sendReadyToViewer();
  }

  function setSingleImage( url ) {
    var filePath = _imageUtils.getStorageSingleFilePath();

    if ( _imageUtils.isSVGImage( filePath ) ) {
      _imageUtils.convertSVGToDataURL( filePath, url, function( dataUrl ) {
        if ( dataUrl ) {
          _imageUtils.handleSingleImageLoad( dataUrl, _viewerPaused );
        }
      } );

      return;
    }

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
    _unavailableFlag = false;

    if ( _imageUtils.getMode() === "file" ) {
      // remove message previously shown
      _message.hide();

      setSingleImage( urls );
    } else if ( _imageUtils.getMode() === "folder" ) {
      // create slider instance
      _slider = new RiseVision.Slider( _imageUtils.getParams(), RiseVision.ImageRLS );
      _slider.init( urls );
    }
  }

  function onFileRefresh( urls ) {
    if ( _unavailableFlag ) {
      // remove the message previously shown
      _message.hide();
    }

    if ( _imageUtils.getMode() === "file" ) {
      setSingleImage( urls );
    } else if ( _imageUtils.getMode() === "folder" ) {
      if ( _errorFlag ) {
        _slider.init( urls );
      } else {
        _slider.refresh( urls );
      }
    }

    _errorFlag = false;
    _unavailableFlag = false;
  }

  function onFileUnavailable( message ) {
    _message.show( message );

    if ( !_viewerPaused ) {
      _imageUtils.sendDoneToViewer();
    }
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

  function setAdditionalParams( additionalParams, modeType, companyId ) {
    var data = _.clone( additionalParams );

    _imageUtils.setMode( modeType );
    _imageUtils.setUsingRLS();

    data.width = _prefs.getInt( "rsW" );
    data.height = _prefs.getInt( "rsH" );
    data.companyId = companyId;

    _imageUtils.setParams( data );

    document.getElementById( "container" ).style.height = _prefs.getInt( "rsH" ) + "px";
    _init();
  }

  function pause() {
    var image = document.querySelector( "#container #image" );

    _viewerPaused = true;

    // in case error timer still running (no conditional check on errorFlag, it may have been reset in onFileRefresh)
    _imageUtils.clearErrorTimer();

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
      _imageUtils.startErrorTimer();
      return;
    }

    if ( _unavailableFlag && _storage ) {
      _storage.retry();

      return;
    }

    if ( _imageUtils.getMode() === "folder" && _slider && _slider.isReady() ) {
      _slider.play();
    } else if ( _imageUtils.getMode() === "file" && image && _imageUtils.isSingleImageGIF() ) {
      image.style.visibility = "visible";
    }
  }

  function showError( message ) {
    _errorFlag = true;

    _message.show( message );

    // destroy slider if it exists and previously notified ready
    if ( _imageUtils.getMode() === "folder" && _slider && _slider.isReady() ) {
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
