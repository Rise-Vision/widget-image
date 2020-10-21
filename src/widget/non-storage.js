var RiseVision = RiseVision || {};

RiseVision.Image = RiseVision.Image || {};

RiseVision.Image.NonStorage = function( data ) {
  "use strict";

  var utils = RiseVision.Common.Utilities,
    // 5 minutes
    _refreshDuration = 300000,
    _refreshIntervalId = null,
    _url = "";

  function _startRefreshInterval() {
    if ( _refreshIntervalId === null ) {
      _refreshIntervalId = setInterval( function() {
        RiseVision.Image.onFileRefresh( _url );
      }, _refreshDuration );
    }
  }

  /*
   *  Public Methods
   */
  function init() {
    // Handle pre-merge use of "url" setting property
    _url = ( data.url && data.url !== "" ) ? data.url : data.selector.url;

    _url = utils.addProtocol( _url );

    RiseVision.Image.onFileInit( _url );

    // start the refresh interval
    _startRefreshInterval();
  }

  return {
    "init": init
  };
};
