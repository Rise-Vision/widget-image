/* global gadgets, _ */
/* eslint-disable no-console */

var RiseVision = RiseVision || {};

RiseVision.ImageRLS = {};

RiseVision.ImageRLS = ( function( gadgets ) {
  "use strict";

  var _mode,
    _displayId,
    _prefs = new gadgets.Prefs(),
    _params = null;

  /*
   *  Private Methods
   */
  function _ready() {
    gadgets.rpc.call( "", "rsevent_ready", null, _prefs.getString( "id" ),
      true, true, true, true, true );
  }

  function _init() {
    console.log( "image-rls init!", _params, _mode, _displayId );
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
    _ready();
    _init();
  }

  function pause() {}

  function play() {}

  function stop() {
    pause();
  }

  function getTableName() {
    return "image_events";
  }

  return {
    "pause": pause,
    "play": play,
    "setAdditionalParams": setAdditionalParams,
    "getTableName": getTableName,
    "stop": stop
  };
} )( gadgets );
