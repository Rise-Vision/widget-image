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
    _utils = RiseVision.ImageUtils,
    _params = null,
    _storage = null,
    _configurationType = null,
    _img = null;

  /*
   *  Private Methods
   */
  function _ready() {
    gadgets.rpc.call( "", "rsevent_ready", null, _prefs.getString( "id" ),
      true, true, true, true, true );
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
      el = _utils.getImageElement( _params );
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

    _ready();
  }

  /*
   *  Public Methods
   */

  function setAdditionalParams( additionalParams, modeType, displayId ) {
    _params = _.clone( additionalParams );
    _mode = modeType;
    _displayId = displayId;

    _params.width = _prefs.getInt( "rsW" );
    _params.height = _prefs.getInt( "rsH" );

    document.getElementById( "container" ).style.height = _prefs.getInt( "rsH" ) + "px";
    _init();
  }

  function pause() {}

  function play() {}

  function stop() {
    pause();
  }

  return {
    "pause": pause,
    "play": play,
    "setAdditionalParams": setAdditionalParams,
    "stop": stop
  };
} )( gadgets );
