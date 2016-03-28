var WIDGET_COMMON_CONFIG = {
  AUTH_PATH_URL: "v1/widget/auth",
  LOGGER_CLIENT_ID: "1088527147109-6q1o2vtihn34292pjt4ckhmhck0rk0o7.apps.googleusercontent.com",
  LOGGER_CLIENT_SECRET: "nlZyrcPLg6oEwO9f9Wfn29Wh",
  LOGGER_REFRESH_TOKEN: "1/xzt4kwzE1H7W9VnKB8cAaCx6zb4Es4nKEoqaYHdTD15IgOrJDtdun6zK6XiATCKT",
  STORAGE_ENV: "prod",
  STORE_URL: "https://store-dot-rvaserver2.appspot.com/"
};
/* global gadgets */

var RiseVision = RiseVision || {};
RiseVision.Common = RiseVision.Common || {};

RiseVision.Common.LoggerUtils = (function() {
  "use strict";

   var displayId = "",
    companyId = "";

  /*
   *  Private Methods
   */

  /* Retrieve parameters to pass to the event logger. */
  function getEventParams(params, cb) {
    var json = null;

    // event is required.
    if (params.event) {
      json = params;

      if (json.file_url) {
        json.file_format = getFileFormat(json.file_url);
      }

      json.company_id = companyId;
      json.display_id = displayId;

      cb(json);
    }
    else {
      cb(json);
    }
  }

  // Get suffix for BQ table name.
  function getSuffix() {
    var date = new Date(),
      year = date.getUTCFullYear(),
      month = date.getUTCMonth() + 1,
      day = date.getUTCDate();

    if (month < 10) {
      month = "0" + month;
    }

    if (day < 10) {
      day = "0" + day;
    }

    return year + month + day;
  }

  /*
   *  Public Methods
   */
  function getFileFormat(url) {
    var hasParams = /[?#&]/,
      str;

    if (!url || typeof url !== "string") {
      return null;
    }

    str = url.substr(url.lastIndexOf(".") + 1);

    // don't include any params after the filename
    if (hasParams.test(str)) {
      str = str.substr(0 ,(str.indexOf("?") !== -1) ? str.indexOf("?") : str.length);

      str = str.substr(0, (str.indexOf("#") !== -1) ? str.indexOf("#") : str.length);

      str = str.substr(0, (str.indexOf("&") !== -1) ? str.indexOf("&") : str.length);
    }

    return str.toLowerCase();
  }

  function getInsertData(params) {
    var BASE_INSERT_SCHEMA = {
      "kind": "bigquery#tableDataInsertAllRequest",
      "skipInvalidRows": false,
      "ignoreUnknownValues": false,
      "templateSuffix": getSuffix(),
      "rows": [{
        "insertId": ""
      }]
    },
    data = JSON.parse(JSON.stringify(BASE_INSERT_SCHEMA));

    data.rows[0].insertId = Math.random().toString(36).substr(2).toUpperCase();
    data.rows[0].json = JSON.parse(JSON.stringify(params));
    data.rows[0].json.ts = new Date().toISOString();

    return data;
  }

  function logEvent(table, params) {
    getEventParams(params, function(json) {
      if (json !== null) {
        RiseVision.Common.Logger.log(table, json);
      }
    });
  }

  /* Set the Company and Display IDs. */
  function setIds(company, display) {
    companyId = company;
    displayId = display;
  }

  return {
    "getInsertData": getInsertData,
    "getFileFormat": getFileFormat,
    "logEvent": logEvent,
    "setIds": setIds
  };
})();

RiseVision.Common.Logger = (function(utils) {
  "use strict";

  var REFRESH_URL = "https://www.googleapis.com/oauth2/v3/token?client_id=" + WIDGET_COMMON_CONFIG.LOGGER_CLIENT_ID +
      "&client_secret=" + WIDGET_COMMON_CONFIG.LOGGER_CLIENT_SECRET +
      "&refresh_token=" + WIDGET_COMMON_CONFIG.LOGGER_REFRESH_TOKEN +
      "&grant_type=refresh_token";

  var serviceUrl = "https://www.googleapis.com/bigquery/v2/projects/client-side-events/datasets/Widget_Events/tables/TABLE_ID/insertAll",
    throttle = false,
    throttleDelay = 1000,
    lastEvent = "",
    refreshDate = 0,
    token = "";

  /*
   *  Private Methods
   */
  function refreshToken(cb) {
    var xhr = new XMLHttpRequest();

    if (new Date() - refreshDate < 3580000) {
      return cb({});
    }

    xhr.open("POST", REFRESH_URL, true);
    xhr.onloadend = function() {
      var resp = JSON.parse(xhr.response);

      cb({ token: resp.access_token, refreshedAt: new Date() });
    };

    xhr.send();
  }

  function isThrottled(event) {
    return throttle && (lastEvent === event);
  }

  /*
   *  Public Methods
   */
  function log(tableName, params) {
    if (!tableName || !params || (params.hasOwnProperty("event") && !params.event) ||
      (params.hasOwnProperty("event") && isThrottled(params.event))) {
      return;
    }

    throttle = true;
    lastEvent = params.event;

    setTimeout(function () {
      throttle = false;
    }, throttleDelay);

    function insertWithToken(refreshData) {
      var xhr = new XMLHttpRequest(),
        insertData, url;

      url = serviceUrl.replace("TABLE_ID", tableName);
      refreshDate = refreshData.refreshedAt || refreshDate;
      token = refreshData.token || token;
      insertData = utils.getInsertData(params);

      // Insert the data.
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", "Bearer " + token);

      if (params.cb && typeof params.cb === "function") {
        xhr.onloadend = function() {
          params.cb(xhr.response);
        };
      }

      xhr.send(JSON.stringify(insertData));
    }

    return refreshToken(insertWithToken);
  }

  return {
    "log": log
  };
})(RiseVision.Common.LoggerUtils);
var RiseVision = RiseVision || {};
RiseVision.Common = RiseVision.Common || {};

RiseVision.Common.RiseCache = (function () {
  "use strict";

  var BASE_CACHE_URL = "//localhost:9494/";

  var _pingReceived = false,
    _isCacheRunning = false;

  function ping(callback) {
    var r = new XMLHttpRequest();

    if (!callback || typeof callback !== "function") {
      return;
    }

    r.open("GET", BASE_CACHE_URL + "ping?callback=_", true);
    r.onreadystatechange = function () {
      try {
        if (r.readyState === 4 ) {
          // save this result for use in getFile()
          _pingReceived = true;

          if(r.status === 200){
            _isCacheRunning = true;

            callback(true, r.responseText);
          } else {
            console.debug("Rise Cache is not running");
            _isCacheRunning = false;

            callback(false, null);
          }
        }
      }
      catch (e) {
        console.debug("Caught exception: ", e.description);
      }

    };
    r.send();
  }

  function getFile(fileUrl, callback, nocachebuster) {
    if (!fileUrl || !callback || typeof callback !== "function") {
      return;
    }

    function fileRequest() {
      var url, str, separator;

      if (_isCacheRunning) {
        // configure url with cachebuster or not
        url = (nocachebuster) ? BASE_CACHE_URL + "?url=" + encodeURIComponent(fileUrl) :
        BASE_CACHE_URL + "cb=" + new Date().getTime() + "?url=" + encodeURIComponent(fileUrl);
      } else {
        if (nocachebuster) {
          url = fileUrl;
        } else {
          str = fileUrl.split("?");
          separator = (str.length === 1) ? "?" : "&";
          url = fileUrl + separator + "cb=" + new Date().getTime();
        }
      }

      makeRequest("HEAD", url);
    }

    function makeRequest(method, url) {
      var xhr = new XMLHttpRequest(),
        request = {
          xhr: xhr,
          url: url
        };

      if (_isCacheRunning) {
        xhr.open(method, url, true);

        xhr.addEventListener("loadend", function () {
          var status = xhr.status || 0;

          if (status >= 200 && status < 300) {
            callback(request);
          } else {
            // Server may not support HEAD request. Fallback to a GET request.
            if (method === "HEAD") {
              makeRequest("GET", url);
            } else {
              callback(request, new Error("The request failed with status code: " + status));
            }
          }
        });

        xhr.send();
      }
      else {
        // Rise Cache is not running (preview), skip HEAD request and execute callback immediately
        callback(request);
      }

    }

    if (!_pingReceived) {
      /* jshint validthis: true */
      return this.ping(fileRequest);
    } else {
      return fileRequest();
    }

  }

  return {
    getFile: getFile,
    ping: ping
  };

})();

var RiseVision = RiseVision || {};

RiseVision.Common = RiseVision.Common || {};

RiseVision.Common.Utilities = (function() {

  function getFontCssStyle(className, fontObj) {
    var family = "font-family:" + fontObj.font.family + "; ";
    var color = "color: " + (fontObj.color ? fontObj.color : fontObj.forecolor) + "; ";
    var size = "font-size: " + (fontObj.size.indexOf("px") === -1 ? fontObj.size + "px; " : fontObj.size + "; ");
    var weight = "font-weight: " + (fontObj.bold ? "bold" : "normal") + "; ";
    var italic = "font-style: " + (fontObj.italic ? "italic" : "normal") + "; ";
    var underline = "text-decoration: " + (fontObj.underline ? "underline" : "none") + "; ";
    var highlight = "background-color: " + (fontObj.highlightColor ? fontObj.highlightColor : fontObj.backcolor) + "; ";

    return "." + className + " {" + family + color + size + weight + italic + underline + highlight + "}";
  }

  function addCSSRules(rules) {
    var style = document.createElement("style");

    for (var i = 0, length = rules.length; i < length; i++) {
      style.appendChild(document.createTextNode(rules[i]));
    }

    document.head.appendChild(style);
  }

  /*
   * Loads Google or custom fonts, if applicable, and injects CSS styles
   * into the head of the document.
   *
   * @param    array    settings    Array of objects with the following form:
 *                                   [{
 *                                     "class": "date",
 *                                     "fontSetting": {
 *                                         bold: true,
 *                                         color: "black",
 *                                         font: {
 *                                           family: "Akronim",
 *                                           font: "Akronim",
 *                                           name: "Verdana",
 *                                           type: "google",
 *                                           url: "http://custom-font-url"
 *                                         },
 *                                         highlightColor: "transparent",
 *                                         italic: false,
 *                                         size: "20",
 *                                         underline: false
 *                                     }
 *                                   }]
   *
   *           object   contentDoc    Document object into which to inject styles
   *                                  and load fonts (optional).
   */
  function loadFonts(settings, contentDoc) {
    settings.forEach(function(item) {
      if (item.class && item.fontSetting) {
        addCSSRules([ getFontCssStyle(item.class, item.fontSetting) ]);
      }

      if (item.fontSetting.font.type) {
        if (item.fontSetting.font.type === "custom" && item.fontSetting.font.family &&
          item.fontSetting.font.url) {
          loadCustomFont(item.fontSetting.font.family, item.fontSetting.font.url,
            contentDoc);
        }
        else if (item.fontSetting.font.type === "google" && item.fontSetting.font.family) {
          loadGoogleFont(item.fontSetting.font.family, contentDoc);
        }
      }
    });
  }

  function loadCustomFont(family, url, contentDoc) {
    var sheet = null;
    var rule = "font-family: " + family + "; " + "src: url('" + url + "');";

    contentDoc = contentDoc || document;

    sheet = contentDoc.styleSheets[0];

    if (sheet !== null) {
      sheet.addRule("@font-face", rule);
    }
  }

  function loadGoogleFont(family, contentDoc) {
    var stylesheet = document.createElement("link");

    contentDoc = contentDoc || document;

    stylesheet.setAttribute("rel", "stylesheet");
    stylesheet.setAttribute("type", "text/css");

    // split to account for family value containing a fallback (eg. Aladin,sans-serif)
    stylesheet.setAttribute("href", "https://fonts.googleapis.com/css?family=" + family.split(",")[0]);

    if (stylesheet !== null) {
      contentDoc.getElementsByTagName("head")[0].appendChild(stylesheet);
    }
  }

  function preloadImages(urls) {
    var length = urls.length,
      images = [];

    for (var i = 0; i < length; i++) {
      images[i] = new Image();
      images[i].src = urls[i];
    }
  }

  function getQueryParameter(param) {
    var query = window.location.search.substring(1),
      vars = query.split("&"),
      pair;

    for (var i = 0; i < vars.length; i++) {
      pair = vars[i].split("=");

      if (pair[0] == param) {
        return decodeURIComponent(pair[1]);
      }
    }

    return "";
  }

  function getRiseCacheErrorMessage(statusCode) {
    var errorMessage = "";
    switch (statusCode) {
      case 404:
        errorMessage = "The file does not exist or cannot be accessed.";
        break;
      case 507:
        errorMessage = "There is not enough disk space to save the file on Rise Cache.";
        break;
      default:
        errorMessage = "There was a problem retrieving the file from Rise Cache.";
    }

    return errorMessage;
  }

  return {
    getQueryParameter: getQueryParameter,
    getFontCssStyle:  getFontCssStyle,
    addCSSRules:      addCSSRules,
    loadFonts:        loadFonts,
    loadCustomFont:   loadCustomFont,
    loadGoogleFont:   loadGoogleFont,
    preloadImages:    preloadImages,
    getRiseCacheErrorMessage: getRiseCacheErrorMessage
  };
})();

/* exported config */
if (typeof angular !== "undefined") {
  angular.module("risevision.common.i18n.config", [])
    .constant("LOCALES_PREFIX", "locales/translation_")
    .constant("LOCALES_SUFIX", ".json");
}

var config = {
  STORAGE_ENV: "prod"
};

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
    _configurationLogged = false;

  var _viewerPaused = true;

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
      var container = document.getElementById("container"),
      image = document.querySelector("#container #image"),
      fragment = document.createDocumentFragment(),
      el = _getImageElement();

      el.style.backgroundImage = "url('" + url + "')";
      el.style.opacity = "0";

      fragment.appendChild(el);
      container.appendChild(fragment);
      el.style.opacity = "1";

      setTimeout(function () {
        container.removeChild(image);
      }, 3000);
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
    _errorLog = null;
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
    _viewerPaused = true;

    // in case error timer still running (no conditional check on errorFlag, it may have been reset in onFileRefresh)
    _clearErrorTimer();

    if (_mode === "folder" && _slider && _slider.isReady()) {
      _slider.pause();
    }
  }

  function play() {
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

    if (_mode === "folder" && _slider && _slider.isReady()) {
      _slider.play();
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

/* global _ */
var RiseVision = RiseVision || {};
RiseVision.Image = RiseVision.Image || {};

RiseVision.Image.Slider = function (params) {
  "use strict";

  var totalSlides = 0,
    $api = null,
    currentFiles = null,
    newFiles = null,
    navTimer = null,
    slideTimer = null,
    isLastSlide = false,
    refreshSlider = false,
    isLoading = true,
    isPlaying = false,
    isInteracting = false,
    navTimeout = 3000;

  /*
   *  Private Methods
   */
  function addSlides() {
    var list = document.querySelector(".tp-banner ul"),
      fragment = document.createDocumentFragment(),
      slides = [],
      slide = null,
      image = null,
      position = "";

    totalSlides = currentFiles.length;

    currentFiles.forEach(function(file) {
      slide = document.createElement("li");
      image = document.createElement("img");

      // Transition
      slide.setAttribute("data-transition", "fade");
      slide.setAttribute("data-masterspeed", 500);
      slide.setAttribute("data-delay", params.duration * 1000);

      image.src = file.url;

      // Alignment
      switch (params.position) {
        case "top-left":
          position = "left top";
          break;
        case "top-center":
          position = "center top";
          break;
        case "top-right":
          position = "right top";
          break;
        case "middle-left":
          position = "left center";
          break;
        case "middle-center":
          position = "center center";
          break;
        case "middle-right":
          position = "right center";
          break;
        case "bottom-left":
          position = "left bottom";
          break;
        case "bottom-center":
          position = "center bottom";
          break;
        case "bottom-right":
          position = "right bottom";
          break;
        default:
          position = "left top";
      }

      image.setAttribute("data-bgposition", position);

      // Scale to Fit
      if (params.scaleToFit) {
        image.setAttribute("data-bgfit", "contain");
      }
      else {
        image.setAttribute("data-bgfit", "normal");
      }

      slide.appendChild(image);
      slides.push(slide);
    });

    slides.forEach(function(slide) {
      fragment.appendChild(slide);
    });

    list.appendChild(fragment);
  }

  function onSlideChanged(data) {
    if (isInteracting) {
      pause();
    }
    // Don't call "done" if user is interacting with the slideshow.
    else {
      if (isLastSlide) {
        isLastSlide = false;
        pause();
        RiseVision.Image.onSliderComplete();

        if (refreshSlider) {
          // Destroy and recreate the slider if the files have changed.
          if ($api) {
            destroySlider();
            init(newFiles);
          }

          refreshSlider = false;
        }
      }
    }

    if (data.slideIndex === totalSlides) {
      isLastSlide = true;
    }
  }

  function destroySlider() {
    // Remove event handlers.
    $("body").off("touchend");
    $api.off("revolution.slide.onloaded");
    $api.off("revolution.slide.onchange");

    // Let the slider clean up after itself.
    $api.revkill();
    $api = null;
  }

  // User has interacted with the slideshow.
  function handleUserActivity() {
    isInteracting = true;
    clearTimeout(slideTimer);

    // Move to next slide and resume the slideshow after a delay.
    slideTimer = setTimeout(function() {
      $api.revnext();
      $api.revresume();

      isInteracting = false;
      isPlaying = true;
    }, params.pause * 1000);

    hideNav();
  }

  // Hide the navigation after a delay.
  function hideNav() {
    if (params.autoHide) {
      clearTimeout(navTimer);

      navTimer = setTimeout(function() {
        $(".tp-leftarrow, .tp-rightarrow").addClass("hidearrows");
      }, navTimeout);
    }
  }

  /*
   *  Public Methods
   *  TODO: Test what happens when folder isn't found.
   */
  function destroy() {
    if ($api) {
      isLastSlide = false;
      pause();
      destroySlider();
    }
  }

  function getCurrentSlide() {
    if ($api && currentFiles && currentFiles.length > 0) {
      return $api.revcurrentslide();
    }

    return -1;
  }

  function init(files) {
    var tpBannerContainer = document.querySelector(".tp-banner-container"),
      fragment = document.createDocumentFragment(),
      tpBanner = document.createElement("div"),
      ul = document.createElement("ul");

    tpBanner.setAttribute("class", "tp-banner");
    tpBanner.appendChild(ul);
    fragment.appendChild(tpBanner);
    tpBannerContainer.appendChild(fragment);

    currentFiles = _.clone(files);

    addSlides();

    isLoading = true;
    $api = $(".tp-banner").revolution({
      "hideThumbs": 0,
      "hideTimerBar": "on",
      "navigationType": "none",
      "onHoverStop": "off",
      "startwidth": params.width,
      "startheight": params.height
    });

    $api.on("revolution.slide.onloaded", function() {
      // Pause slideshow since it will autoplay and this is not configurable.
      pause();
      isLoading = false;
      RiseVision.Image.onSliderReady();
    });

    $api.on("revolution.slide.onchange", function (e, data) {
      onSlideChanged(data);
    });

    // Swipe the slider.
    $("body").on("touchend", ".tp-banner", function() {
      handleUserActivity();
      $(".tp-leftarrow, .tp-rightarrow").removeClass("hidearrows");
    });

    // Touch the navigation arrows.
    $("body").on("touchend", ".tp-leftarrow, .tp-rightarrow", function() {
      handleUserActivity();
    });

    hideNav();
  }

  function isReady() {
    return !isLoading;
  }

  function play() {
    if ($api) {
      // Reset slideshow to first slide.
      if (params.hasOwnProperty("resume") && !params.resume) {
        $api.revshowslide(0);
      }

      if (!isPlaying) {
        $api.revresume();
        isPlaying = true;
      }
    }
  }

  function pause() {
    if ($api && isPlaying) {
      $api.revpause();
      isPlaying = false;
    }
  }

  function refresh(files) {
    // Start preloading images right away.
    RiseVision.Common.Utilities.preloadImages(files);
    newFiles = _.clone(files);
    refreshSlider = true;
  }

  return {
    "getCurrentSlide": getCurrentSlide,
    "destroy": destroy,
    "init": init,
    "isReady": isReady,
    "play": play,
    "pause": pause,
    "refresh": refresh
  };
};

/* global config */
var RiseVision = RiseVision || {};
RiseVision.Image = RiseVision.Image || {};

RiseVision.Image.StorageFile = function (params) {
  "use strict";

  var _initialLoad = true;

  /*
   *  Public Methods
   */
  function init() {
    var storage = document.querySelector("rise-storage");

    storage.addEventListener("rise-storage-response", function(e) {
      var url;

      if (e.detail && e.detail.url) {

        url = e.detail.url.replace("'", "\\'");

        if (_initialLoad) {
          _initialLoad = false;

          RiseVision.Image.onFileInit(url);
        }
        else {
          // check for "changed" property
          if (e.detail.hasOwnProperty("changed")) {
            if (e.detail.changed) {
              RiseVision.Image.onFileRefresh(url);
            }
            else {
              // in the event of a network failure and recovery, check if the Widget is in a state of storage error
              if (RiseVision.Image.hasStorageError()) {
                // proceed with refresh logic so the Widget can eventually play video again from a network recovery
                RiseVision.Image.onFileRefresh(e.detail.url);
              }
            }
          }
        }
      }
    });

    storage.addEventListener("rise-storage-api-error", function(e) {
      var params = {
          "event": "error",
          "event_details": "storage api error",
          "error_details": "Response code: " + e.detail.code + ", message: " + e.detail.message
        };

      RiseVision.Image.logEvent(params, true);
      RiseVision.Image.showError("Sorry, there was a problem communicating with Rise Storage.");
    });

    storage.addEventListener("rise-storage-no-file", function(e) {
      var params = {
        "event": "error",
        "event_details": "storage file not found",
        "file_url": e.detail
      },
        img = document.getElementById("image");

      // clear the existing image
      img.style.background = "";

      RiseVision.Image.logEvent(params, true);
      RiseVision.Image.showError("The selected image does not exist or has been moved to Trash.");
    });

    storage.addEventListener("rise-storage-file-throttled", function(e) {
      var params = {
        "event": "error",
        "event_details": "storage file throttled",
        "file_url": e.detail
      };

      RiseVision.Image.logEvent(params, true);
      RiseVision.Image.showError("The selected image is temporarily unavailable.");
    });

    storage.addEventListener("rise-storage-subscription-expired", function() {
      var params = {
        "event": "error",
        "event_details": "storage subscription expired"
      };

      RiseVision.Image.logEvent(params, true);
      RiseVision.Image.showError("Rise Storage subscription is not active.");
    });

    storage.addEventListener("rise-storage-error", function(e) {
      var fileUrl = (e.detail && e.detail.request && e.detail.request.url) ? e.detail.request.url : null,
        params = {
          "event": "error",
          "event_details": "rise storage error",
          "error_details": "The request failed with status code: " + e.detail.error.currentTarget.status,
          "file_url": fileUrl
        };

      RiseVision.Image.logEvent(params, true);
      RiseVision.Image.showError("Sorry, there was a problem communicating with Rise Storage.", true);
    });

    storage.addEventListener("rise-cache-error", function(e) {
      var fileUrl = (e.detail && e.detail.request && e.detail.request.url) ? e.detail.request.url : null,
        params = {
          "event": "error",
          "event_details": "rise cache error",
          "error_details": e.detail.error.message,
          "file_url": fileUrl
        };

      RiseVision.Image.logEvent(params, true);

      var statusCode = 0;
      // Show a different message if there is a 404 coming from rise cache
      if(e.detail.error.message){
        statusCode = +e.detail.error.message.substring(e.detail.error.message.indexOf(":")+2);
      }

      var errorMessage = RiseVision.Common.Utilities.getRiseCacheErrorMessage(statusCode);
      RiseVision.Image.showError(errorMessage);
    });

    storage.addEventListener("rise-cache-not-running", function(e) {

      var params = {
        "event": "error",
        "event_details": "rise cache not running",
        "error_details": (e.detail && e.detail.error)? e.detail.error.message: ""
      };

      RiseVision.Image.logEvent(params, true);
    });

    storage.setAttribute("folder", params.storage.folder);
    storage.setAttribute("fileName", params.storage.fileName);
    storage.setAttribute("companyId", params.storage.companyId);
    storage.setAttribute("env", config.STORAGE_ENV);
    storage.go();
  }

  return {
    "init": init
  };
};

/* global config, _ */

var RiseVision = RiseVision || {};
RiseVision.Image = RiseVision.Image || {};

RiseVision.Image.StorageFolder = function (data) {
  "use strict";

  var _isLoading = true,
    _files = [],
    _timer = null;

  function processUrl(e) {
    var file;

    if (e.detail) {

      // Image has been added.
      if (e.detail.added) {
        _files.push({
          "name": e.detail.name,
          "url": e.detail.url
        });
      }

      // Image has been changed.
      if (e.detail.changed) {
        file = _.find(_files, function (file) {
          return file.name === e.detail.name;
        });

        file.url = e.detail.url;
      }

      // Image has been deleted.
      if (e.detail.deleted) {
        _files = _.reject(_files, function(file) {
          return file.name === e.detail.name;
        });
      }
    }

    _files = _.sortBy(_files, function(file) {
      return file.name.toLowerCase();
    });
  }

  function handleResponse(e) {
    processUrl(e);

    // Image has been added.
    if (e.detail.added) {
      if (_isLoading) {
        // Need to wait for at least 2 images to load before initializing the slider.
        // Otherwise, the revolution.slide.onchange event will never fire, and this event is used
        // to check whether or not the slider should refresh.
        if (_files.length > 1) {
          _isLoading = false;

          clearTimeout(_timer);
          RiseVision.Image.onFileInit(_files);
        }
        // Set a timeout in case there is only one image in the folder.
        else {
          _timer = setTimeout(function() {
            _isLoading = false;
            RiseVision.Image.onFileInit(_files);
          }, 5000);
        }

        return;
      }
    }

    // Unchanged
    if (e.detail.hasOwnProperty("changed") && !e.detail.changed) {
      // in the event of a network failure and recovery, check if the Widget is in a state of storage error
      if (!RiseVision.Image.hasStorageError()) {
        // only proceed with refresh logic below if there's been a storage error, otherwise do nothing
        // this is so the Widget can eventually play slideshow again from a network recovery
        return;
      }
    }

    RiseVision.Image.onFileRefresh(_files);
  }

  /*
   *  Public Methods
   */
  function init() {
    var storage = document.querySelector("rise-storage");

    storage.addEventListener("rise-storage-response", handleResponse);

    storage.addEventListener("rise-storage-api-error", function(e) {
      var params = {
        "event": "error",
        "event_details": "storage api error",
        "error_details": "Response code: " + e.detail.code + ", message: " + e.detail.message
      };

      RiseVision.Image.logEvent(params, true);
      RiseVision.Image.showError("Sorry, there was a problem communicating with Rise Storage.");
    });

    storage.addEventListener("rise-storage-empty-folder", function () {
      var params = {
        "event": "error",
        "event_details": "storage folder empty"
      };

      RiseVision.Image.logEvent(params, true);
      RiseVision.Image.showError("The selected folder does not contain any images.");
    });

    storage.addEventListener("rise-storage-no-folder", function (e) {
      var params = {
        "event": "error",
        "event_details": "storage folder doesn't exist",
        "error_details": e.detail
      };

      RiseVision.Image.logEvent(params, true);
      RiseVision.Image.showError("The selected folder does not exist or has been moved to Trash.");
    });


    storage.addEventListener("rise-storage-folder-invalid", function () {
      var params = {
        "event": "error",
        "event_details": "storage folder format(s) invalid"
      };

      RiseVision.Image.logEvent(params, true);
      RiseVision.Image.showError("The selected folder does not contain any supported image formats.");
    });

    storage.addEventListener("rise-storage-subscription-expired", function() {
      var params = {
        "event": "error",
        "event_details": "storage subscription expired"
      };

      RiseVision.Image.logEvent(params, true);
      RiseVision.Image.showError("Rise Storage subscription is not active.");
    });

    storage.addEventListener("rise-storage-error", function(e) {
      var params = {
        "event": "rise storage error",
        "event_details": "The request failed with status code: " + e.detail.error.currentTarget.status
      };

      RiseVision.Image.logEvent(params, true);
      RiseVision.Image.showError("Sorry, there was a problem communicating with Rise Storage.", true);
    });

    storage.addEventListener("rise-cache-error", function(e) {
      var params = {
        "event": "rise cache error",
        "event_details": e.detail.error.message
      };

      RiseVision.Image.logEvent(params, true);

      var statusCode = 0;
      // Show a different message if there is a 404 coming from rise cache
      if(e.detail.error.message){
        statusCode = +e.detail.error.message.substring(e.detail.error.message.indexOf(":")+2);
      }

      var errorMessage = RiseVision.Common.Utilities.getRiseCacheErrorMessage(statusCode);
      RiseVision.Image.showError(errorMessage);
    });

    storage.addEventListener("rise-cache-not-running", function(e) {

      var params = {
        "event": "error",
        "event_details": "rise cache not running",
        "error_details": (e.detail && e.detail.error)? e.detail.error.message: ""
      };

      RiseVision.Image.logEvent(params, true);
    });

    storage.setAttribute("fileType", "image");
    storage.setAttribute("companyId", data.storage.companyId);
    storage.setAttribute("folder", data.storage.folder);
    storage.setAttribute("env", config.STORAGE_ENV);

    storage.go();
  }

  return {
    "init": init
  };
};

var RiseVision = RiseVision || {};
RiseVision.Image = RiseVision.Image || {};

RiseVision.Image.NonStorage = function (data) {
  "use strict";

  var riseCache = RiseVision.Common.RiseCache;

  var _refreshDuration = 300000,  // 5 minutes
    _refreshIntervalId = null;

  var _isLoading = true;

  var _url = "";

  function _getFile(omitCacheBuster) {
    var params;

    riseCache.getFile(_url, function (response, error) {
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

        // error occurred
        params = {
          "event": "error",
          "event_details": "non-storage error",
          "error_details": error.message,
          "file_url": response.url
        };

        RiseVision.Image.logEvent(params, true);

        var statusCode = 0;
        // Show a different message if there is a 404 coming from rise cache
        if(error.message){
          statusCode = +error.message.substring(error.message.indexOf(":")+2);
        }

        var errorMessage = RiseVision.Common.Utilities.getRiseCacheErrorMessage(statusCode);
        RiseVision.Image.showError(errorMessage);
      }
    }, omitCacheBuster);
  }

  function _startRefreshInterval() {
    if (_refreshIntervalId === null) {
      _refreshIntervalId = setInterval(function () {
        _getFile(false);
      }, _refreshDuration);
    }
  }

  /*
   *  Public Methods
   */
  function init() {
    // Handle pre-merge use of "url" setting property
    _url = (data.url && data.url !== "") ? data.url : data.selector.url;

    _getFile(true);
  }

  return {
    "init": init
  };
};

var RiseVision = RiseVision || {};
RiseVision.Common = RiseVision.Common || {};

RiseVision.Common.Message = function (mainContainer, messageContainer) {
  "use strict";

  var _active = false;

  function _init() {
    try {
      messageContainer.style.height = mainContainer.style.height;
    } catch (e) {
      console.warn("Can't initialize Message - ", e.message);
    }
  }

  /*
   *  Public Methods
   */
  function hide() {
    if (_active) {
      // clear content of message container
      while (messageContainer.firstChild) {
        messageContainer.removeChild(messageContainer.firstChild);
      }

      // hide message container
      messageContainer.style.display = "none";

      // show main container
      mainContainer.style.visibility = "visible";

      _active = false;
    }
  }

  function show(message) {
    var fragment = document.createDocumentFragment(),
      p;

    if (!_active) {
      // hide main container
      mainContainer.style.visibility = "hidden";

      messageContainer.style.display = "block";

      // create message element
      p = document.createElement("p");
      p.innerHTML = message;
      p.setAttribute("class", "message");

      fragment.appendChild(p);
      messageContainer.appendChild(fragment);

      _active = true;
    } else {
      // message already being shown, update message text
      p = messageContainer.querySelector(".message");
      p.innerHTML = message;
    }
  }

  _init();

  return {
    "hide": hide,
    "show": show
  };
};

/* global RiseVision, gadgets */
(function (window, document, gadgets) {
  "use strict";

  var id = new gadgets.Prefs().getString("id");

  window.oncontextmenu = function () {
    return false;
  };

  document.body.onmousedown = function() {
    return false;
  };

  function configure(names, values) {
    var additionalParams, mode,
      companyId = "",
      displayId = "";

    if (Array.isArray(names) && names.length > 0 && Array.isArray(values) && values.length > 0) {
      // company id
      if (names[0] === "companyId") {
        companyId = values[0];
      }

      // display id
      if (names[1] === "displayId") {
        if (values[1]) {
          displayId = values[1];
        }
      else {
          displayId = "preview";
        }
      }

      // provide LoggerUtils the ids to use
      RiseVision.Common.LoggerUtils.setIds(companyId, displayId);

      // additional params
      if (names[2] === "additionalParams") {
        additionalParams = JSON.parse(values[2]);

        if (Object.keys(additionalParams.storage).length !== 0) {
          // storage file or folder selected
          if (!additionalParams.storage.fileName) {
            // folder was selected
            mode = "folder";
          } else {
            // file was selected
            mode = "file";
          }
        } else {
          // non-storage file was selected
          mode = "file";
        }

        RiseVision.Image.setAdditionalParams(additionalParams, mode);
      }
    }
  }

  function pause() {
    RiseVision.Image.pause();
  }

  function play() {
    RiseVision.Image.play();
  }

  function stop() {
    RiseVision.Image.stop();
  }

  function polymerReady() {
    window.removeEventListener("WebComponentsReady", polymerReady);

    if (id && id !== "") {
      gadgets.rpc.register("rscmd_play_" + id, play);
      gadgets.rpc.register("rscmd_pause_" + id, pause);
      gadgets.rpc.register("rscmd_stop_" + id, stop);
      gadgets.rpc.register("rsparam_set_" + id, configure);
      gadgets.rpc.call("", "rsparam_get", null, id, ["companyId", "displayId", "additionalParams"]);
    }
  }

  window.addEventListener("WebComponentsReady", polymerReady);

})(window, document, gadgets);

/* jshint ignore:start */
var _gaq = _gaq || [];

_gaq.push(['_setAccount', 'UA-57092159-3']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
/* jshint ignore:end */
