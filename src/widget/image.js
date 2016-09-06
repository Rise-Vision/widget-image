/* global gadgets, _ */

var RiseVision = RiseVision || {};
RiseVision.Image = {};

RiseVision.Image = (function (gadgets) {
  "use strict";

  var _mode;

  var _prefs = new gadgets.Prefs(),
    _message = null,
    _params = null;

  var _storage = null,
    _nonStorage = null,
    _slider = null;

  var _currentFiles = [];

  var _errorLog = null,
    _configurationType = null,
    _errorTimer = null,
    _errorFlag = false,
    _storageErrorFlag = false,
    _configurationLogged = false,
    _unavailableFlag = false;

  var _viewerPaused = true;

  var _img = null;

  /*
   *  Private Methods
   */
  function _ready() {
    gadgets.rpc.call("", "rsevent_ready", null, _prefs.getString("id"),
      true, true, true, true, true);
  }

  function _done() {
    gadgets.rpc.call("", "rsevent_done", null, _prefs.getString("id"));

    // Any errors need to be logged before the done event.
    if (_errorLog !== null) {
      logEvent(_errorLog, true);
    }

    // log "done" event
    logEvent({ "event": "done", "file_url": _getCurrentFile() }, false);
  }

  function _clearErrorTimer() {
    clearTimeout(_errorTimer);
    _errorTimer = null;
  }

  function _startErrorTimer() {
    _clearErrorTimer();

    _errorTimer = setTimeout(function () {
      // notify Viewer widget is done
      _done();
    }, 5000);
  }

  function _getCurrentFile() {
    var slideNum = -1;

    if (_currentFiles && _currentFiles.length > 0) {
      if (_mode === "file") {
        return _currentFiles[0];
      }
      else if (_mode === "folder" && _slider && _slider.isReady()) {
        // retrieve the currently played slide
        slideNum = _slider.getCurrentSlide();

        if (slideNum !== -1) {
          return _currentFiles[slideNum];
        }
      }
    }

    return null;
  }

  function init() {
    var container = document.getElementById("container"),
      fragment = document.createDocumentFragment(),
      el = document.createElement("div"),
      isStorageFile;

    // create instance of message
    _message = new RiseVision.Common.Message(document.getElementById("container"),
      document.getElementById("messageContainer"));

    // show wait message
    _message.show("Please wait while your image is downloaded.");

    // legacy
    if (_params.background && Object.keys(_params.background).length > 0) {
      document.body.style.background = _params.background.color;
    }

    if (_mode === "file") {
      // create the image <div> within the container <div>
      el = _getImageElement();
      fragment.appendChild(el);
      container.appendChild(fragment);

      _img = new Image();

      isStorageFile = (Object.keys(_params.storage).length !== 0);

      if (!isStorageFile) {
        _configurationType = "custom";

        _nonStorage = new RiseVision.Image.NonStorage(_params);
        _nonStorage.init();
      } else {
        _configurationType = "storage file";

        // create and initialize the Storage file instance
        _storage = new RiseVision.Image.StorageFile(_params);
        _storage.init();
      }
    }
    else if (_mode === "folder") {
      // create the slider container <div> within the container <div>
      el.className = "tp-banner-container";

      fragment.appendChild(el);
      container.appendChild(fragment);

      _configurationType = "storage folder";

      // create and initialize the Storage folder instance
      _storage = new RiseVision.Image.StorageFolder(_params);
      _storage.init();
    }

    _ready();
  }

  function _getImageElement() {
    var el = document.createElement("div");

    el.setAttribute("id", "image");
    el.className = _params.position;
    el.className = _params.scaleToFit ? el.className + " scale-to-fit" : el.className;

    return el;
  }

  function setSingleImage(url) {

    _img.onload = function() {
      var image = document.querySelector("#container #image");

      image.style.backgroundImage = "url('" + url + "')";
    };

    _img.onerror = function() {
      logEvent({
        "event": "error",
        "event_details": "image load error",
        "file_url": url
      }, true);
    };

    _img.src = url.replace("\\'", "'"); // handles special characters
  }

  /*
   *  Public Methods
   */
  function hasStorageError() {
    return _storageErrorFlag;
  }

  function logEvent(params, isError) {
    if (isError) {
      _errorLog = params;
    }

    RiseVision.Common.LoggerUtils.logEvent(getTableName(), params);
  }

  function onFileInit(urls) {
    if (_mode === "file") {
      // urls value will be a string
      _currentFiles[0] = urls;

      _unavailableFlag = false;

      // remove a message previously shown
      _message.hide();

      setSingleImage(_currentFiles[0]);

    } else if (_mode === "folder") {
      // urls value will be an array
      _currentFiles = urls;

      // create slider instance
      _slider = new RiseVision.Image.Slider(_params);
      _slider.init(urls);
    }
  }

  function onFileRefresh(urls) {
    if (_mode === "file") {
      // urls value will be a string of one url
      _currentFiles[0] = urls;

      setSingleImage(_currentFiles[0]);

    } else if (_mode === "folder") {
      // urls value will be an array of urls
      _currentFiles = urls;

      _slider.refresh(_currentFiles);
    }

    // in case refreshed file fixes an error with previous file, ensure flag is removed so playback is attempted again
    _errorFlag = false;
    _storageErrorFlag = false;
    _unavailableFlag = false;
    _errorLog = null;
  }

  function onFileUnavailable(message) {
    _unavailableFlag = true;

    _message.show(message);

    // if Widget is playing right now, run the timer
    if (!_viewerPaused) {
      _startErrorTimer();
    }
  }

  function setAdditionalParams(additionalParams, modeType) {
    _params = _.clone(additionalParams);
    _mode = modeType;

    _params.width = _prefs.getInt("rsW");
    _params.height = _prefs.getInt("rsH");

    document.getElementById("container").style.height = _prefs.getInt("rsH") + "px";
    init();
  }

  function onSliderReady() {
    _message.hide();

    if (!_viewerPaused) {
      _slider.play();
    }
  }

  function onSliderComplete() {
    _done();
  }

  function pause() {
    var image = document.querySelectorAll("#container #image");

    _viewerPaused = true;

    // in case error timer still running (no conditional check on errorFlag, it may have been reset in onFileRefresh)
    _clearErrorTimer();

    if (_mode === "folder" && _slider && _slider.isReady()) {
      _slider.pause();
    }
    else if (_mode === "file" && image.length > 0) {
      for (var i = 0; i < image.length; i += 1) {
        image[i].style.visibility = "hidden";
      }
    }
  }

  function play() {
    var image = document.querySelectorAll("#container #image");

    _viewerPaused = false;

    if (!_configurationLogged) {
      logEvent({ "event": "configuration", "event_details": _configurationType }, false);
      _configurationLogged = true;
    }

    logEvent({ "event": "play", "file_url": _getCurrentFile() }, false);

    if (_errorFlag) {
      _startErrorTimer();
      return;
    }

    if (_unavailableFlag) {
      if (_mode === "file" && _storage) {
        _storage.retry();
      }

      return;
    }

    if (_mode === "folder" && _slider && _slider.isReady()) {
      _slider.play();
    }
    else if (_mode === "file" && image.length > 0) {
      for (var i = 0; i < image.length; i += 1) {
        image[i].style.visibility = "visible";
      }
    }
  }

  function getTableName() {
    return "image_events";
  }

  function showError(message, isStorageError) {
    _errorFlag = true;
    _storageErrorFlag = typeof isStorageError !== "undefined";

    _message.show(message);

    // destroy slider if it exists and previously notified ready
    if (_mode === "folder" && _slider && _slider.isReady()) {
      _slider.destroy();
    }

    if (!_viewerPaused) {
      _startErrorTimer();
    }
  }

  function stop() {
    pause();
  }

  return {
    "hasStorageError": hasStorageError,
    "logEvent": logEvent,
    "onFileInit": onFileInit,
    "onFileRefresh": onFileRefresh,
    "onFileUnavailable": onFileUnavailable,
    "onSliderComplete": onSliderComplete,
    "onSliderReady": onSliderReady,
    "pause": pause,
    "play": play,
    "setAdditionalParams": setAdditionalParams,
    "getTableName": getTableName,
    "showError": showError,
    "stop": stop
  };
})(gadgets);
