/* global config */
var RiseVision = RiseVision || {};

RiseVision.Image = RiseVision.Image || {};

RiseVision.Image.StorageFile = function( params, displayId ) {
  "use strict";

  var utils = RiseVision.Common.Utilities,
    imageUtils = RiseVision.ImageUtils,
    _initialLoad = true;

  /*
   *  Public Methods
   */
  function init() {
    var storage = document.querySelector( "rise-storage" ),
      viewerParams = utils.getViewerParams();

    storage.addEventListener( "rise-storage-response", function( e ) {
      var url;

      if ( e.detail && e.detail.url ) {

        url = e.detail.url.replace( "'", "\\'" );

        if ( _initialLoad ) {
          _initialLoad = false;

          RiseVision.Image.onFileInit( url );
        } else {
          // check for "changed" property
          if ( e.detail.hasOwnProperty( "changed" ) ) {
            if ( e.detail.changed ) {
              RiseVision.Image.onFileRefresh( url );
            } else {
              // in the event of a network failure and recovery, check if the Widget is in a state of storage error
              if ( RiseVision.Image.hasStorageError() ) {
                // proceed with refresh logic so the Widget can eventually play video again from a network recovery
                RiseVision.Image.onFileRefresh( e.detail.url );
              }
            }
          }
        }
      }
    } );

    storage.addEventListener( "rise-storage-api-error", function( e ) {
      var params = {
        "event": "error",
        "event_details": "storage api error",
        "error_details": "Response code: " + e.detail.code + ", message: " + e.detail.message
      };

      imageUtils.logEvent( params, { severity: "error", errorCode: "E000000013" } );
      RiseVision.Image.handleError();
    } );

    storage.addEventListener( "rise-storage-no-file", function( e ) {
      var params = {
          "event": "error",
          "event_details": "storage file not found",
          "file_url": e.detail
        },
        img = document.getElementById( "image" );

      // clear the existing image
      img.style.background = "";

      imageUtils.logEvent( params, { severity: "error", errorCode: "E000000014" } );
      RiseVision.Image.handleError();
    } );

    storage.addEventListener( "rise-storage-file-throttled", function( e ) {
      var params = {
        "event": "error",
        "event_details": "storage file throttled",
        "file_url": e.detail
      };

      imageUtils.logEvent( params, { severity: "error", errorCode: "E000000015" } );
      RiseVision.Image.handleError();
    } );

    storage.addEventListener( "rise-storage-subscription-error", function( e ) {
      var params = {
        "event": "error",
        "event_details": "storage subscription error",
        "error_details": "The request failed with status code: " + e.detail.error.currentTarget.status
      };

      imageUtils.logEvent( params, { severity: "error", errorCode: "E000000016" } );
    } );

    storage.addEventListener( "rise-storage-subscription-expired", function() {
      var params = {
        "event": "error",
        "event_details": "storage subscription expired"
      };

      imageUtils.logEvent( params, { severity: "error", errorCode: "E000000017" } );
      RiseVision.Image.handleError();
    } );

    storage.addEventListener( "rise-storage-error", function( e ) {
      var fileUrl = ( e.detail && e.detail.request && e.detail.request.url ) ? e.detail.request.url : null,
        params = {
          "event": "error",
          "event_details": "rise storage error",
          "error_details": "The request failed with status code: " + e.detail.error.currentTarget.status + " | error object: " + JSON.stringify( e.detail.error ),
          "file_url": fileUrl
        };

      imageUtils.logEvent( params, { severity: "error", errorCode: "E000000018" } );
      RiseVision.Image.handleError( true );
    } );

    storage.addEventListener( "rise-cache-error", function( e ) {
      var fileUrl = ( e.detail && e.detail.request && e.detail.request.url ) ? e.detail.request.url : null,
        params = {
          "event": "error",
          "event_details": "rise cache error",
          "error_details": e.detail.error.message,
          "file_url": fileUrl
        };

      // log the error
      imageUtils.logEvent( params, { severity: "error", errorCode: "E000000019" } );

      // handle the error
      RiseVision.Image.handleError();
    } );

    storage.addEventListener( "rise-cache-not-running", function( e ) {

      var params = {
        "event": "error",
        "event_details": "rise cache not running",
        "error_details": ""
      };

      if ( e.detail ) {
        if ( e.detail.error ) {
          // storage v1
          params.error_details = e.detail.error.message;
        } else if ( e.detail.resp && e.detail.resp.error ) {
          // storage v2
          params.error_details = e.detail.resp.error.message;
        }
      }

      imageUtils.logEvent( params, { severity: "error", errorCode: "E000000020" } );

      if ( e.detail && e.detail.isPlayerRunning ) {
        RiseVision.Image.handleError( true );
      }
    } );

    storage.addEventListener( "rise-cache-file-unavailable", function() {
      RiseVision.Image.onFileUnavailable( "File is downloading" );
    } );

    storage.setAttribute( "folder", params.storage.folder );
    storage.setAttribute( "fileName", params.storage.fileName );
    storage.setAttribute( "companyId", params.storage.companyId );
    storage.setAttribute( "displayId", displayId );
    storage.setAttribute( "env", config.STORAGE_ENV );

    viewerParams && storage.setAttribute( "viewerEnv", viewerParams.viewer_env );
    viewerParams && storage.setAttribute( "viewerId", viewerParams.viewer_id );
    viewerParams && storage.setAttribute( "viewerType", viewerParams.viewer_type );

    storage.go();
  }

  function retry() {
    var storage = document.querySelector( "rise-storage" );

    if ( !storage ) {
      return;
    }

    storage.go();
  }

  return {
    "init": init,
    "retry": retry
  };
};
