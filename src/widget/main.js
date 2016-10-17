/* global RiseVision, gadgets, config */
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

  function init() {
    if (id && id !== "") {
      gadgets.rpc.register("rscmd_play_" + id, play);
      gadgets.rpc.register("rscmd_pause_" + id, pause);
      gadgets.rpc.register("rscmd_stop_" + id, stop);
      gadgets.rpc.register("rsparam_set_" + id, configure);
      gadgets.rpc.call("", "rsparam_get", null, id, ["companyId", "displayId", "additionalParams"]);
    }
  }

  // check which version of Rise Cache is running and dynamically add rise-storage dependencies
  RiseVision.Common.RiseCache.isV2Running(function (isV2) {
    var fragment = document.createDocumentFragment(),
      link = document.createElement("link"),
      webcomponents = document.createElement("script"),
      href = config.COMPONENTS_PATH + ((isV2) ? "rise-storage-v2" : "rise-storage") + "/rise-storage.html",
      storage = document.createElement("rise-storage"),
      storageReady = false,
      polymerReady = false;

    function onPolymerReady() {
      window.removeEventListener("WebComponentsReady", onPolymerReady);
      polymerReady = true;

      if (storageReady && polymerReady) {
        init();
      }
    }

    function onStorageReady() {
      storage.removeEventListener("rise-storage-ready", onStorageReady);
      storageReady = true;

      if (storageReady && polymerReady) {
        init();
      }
    }

    webcomponents.src = config.COMPONENTS_PATH + "webcomponentsjs/webcomponents-lite.min.js";
    window.addEventListener("WebComponentsReady", onPolymerReady);

    // add the webcomponents polyfill source to the document head
    document.getElementsByTagName("head")[0].appendChild(webcomponents);

    link.setAttribute("rel", "import");
    link.setAttribute("href", href);

    // add the rise-storage <link> element to document head
    document.getElementsByTagName("head")[0].appendChild(link);

    storage.setAttribute("refresh", 5);

    if (isV2) {
      storage.setAttribute("usage", "widget");
    }

    storage.addEventListener("rise-storage-ready", onStorageReady);
    fragment.appendChild(storage);

    // add the <rise-storage> element to the body
    document.body.appendChild(fragment);
  });

})(window, document, gadgets);
