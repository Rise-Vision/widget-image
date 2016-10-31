var RiseVision = RiseVision || {};
RiseVision.Image = RiseVision.Image || {};

RiseVision.Image.NonStorage = function (data) {
  "use strict";

  var riseCache = RiseVision.Common.RiseCache,
    utils = RiseVision.Common.Utilities;

  var _refreshDuration = 300000,  // 5 minutes
    _refreshIntervalId = null;

  var _isLoading = true;

  var _url = "";

  function _getFile(omitCacheBuster) {
    var params;

    riseCache.getFile(_url, function (response, error) {
      var statusCode = 0,
        errorMessage;

      if (!error) {

        if (_isLoading) {
          _isLoading = false;

          RiseVision.Image.onFileInit(response.url);

          // start the refresh interval
          _startRefreshInterval();

        } else {
          RiseVision.Image.onFileRefresh(response.url);
        }

      } else {

        if (error.message && error.message === "File is downloading") {
          RiseVision.Image.onFileUnavailable(error.message);  
        } else {

          // error occurred
          params = {
            "event": "error",
            "event_details": "non-storage error",
            "error_details": error.message,
            "file_url": response.url
          };

          RiseVision.Image.logEvent(params, true);

          if (riseCache.isV2Running()) {
            errorMessage = riseCache.getErrorMessage(statusCode);
          }
          else {
            // Show a different message if there is a 404 coming from rise cache
            if(error.message){
              statusCode = +error.message.substring(error.message.indexOf(":")+2);
            }

            errorMessage = utils.getRiseCacheErrorMessage(statusCode);
          }

          RiseVision.Image.showError(errorMessage);  
        }        
      }
    }, omitCacheBuster);
  }

  function _startRefreshInterval() {
    if (_refreshIntervalId === null) {
      _refreshIntervalId = setInterval(function () {
        _getFile(true);
      }, _refreshDuration);
    }
  }

  /*
   *  Public Methods
   */
  function init() {
    // Handle pre-merge use of "url" setting property
    _url = (data.url && data.url !== "") ? data.url : data.selector.url;

    _url = utils.addProtocol(_url);

    _getFile(true);
  }

  return {
    "init": init
  };
};
