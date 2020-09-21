/* global config */
var RiseVision = RiseVision || {};

RiseVision.Image = RiseVision.Image || {};

RiseVision.Image.StorageFile = function( params, displayId ) {
  "use strict";

  var utils = RiseVision.Common.Utilities,
    imageUtils = RiseVision.ImageUtils,
    riseCache = RiseVision.Common.RiseCache,
    _initialLoad = true;

  /*
   *  Public Methods
   */
  function init() {
    var storage = document.querySelector( "rise-storage" ),
      envVerifierParams = utils.getEnvVerifierParams();

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

      imageUtils.logEvent( params );
      RiseVision.Image.showError( "Sorry, there was a problem communicating with Rise Storage." );
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

      imageUtils.logEvent( params );
      RiseVision.Image.showError( "The selected image does not exist or has been moved to Trash." );
    } );

    storage.addEventListener( "rise-storage-file-throttled", function( e ) {
      var params = {
        "event": "error",
        "event_details": "storage file throttled",
        "file_url": e.detail
      };

      imageUtils.logEvent( params );
      RiseVision.Image.showError( "The selected image is temporarily unavailable." );
    } );

    storage.addEventListener( "rise-storage-subscription-error", function( e ) {
      var params = {
        "event": "error",
        "event_details": "storage subscription error",
        "error_details": "The request failed with status code: " + e.detail.error.currentTarget.status
      };

      imageUtils.logEvent( params );
    } );

    storage.addEventListener( "rise-storage-subscription-expired", function() {
      var params = {
        "event": "error",
        "event_details": "storage subscription expired"
      };

      imageUtils.logEvent( params );
      RiseVision.Image.showError( "Rise Storage subscription is not active." );
    } );

    storage.addEventListener( "rise-storage-error", function( e ) {
      var fileUrl = ( e.detail && e.detail.request && e.detail.request.url ) ? e.detail.request.url : null,
        params = {
          "event": "error",
          "event_details": "rise storage error",
          "error_details": "The request failed with status code: " + e.detail.error.currentTarget.status,
          "file_url": fileUrl
        };

      imageUtils.logEvent( params );
      RiseVision.Image.showError( "Sorry, there was a problem communicating with Rise Storage.", true );
    } );

    storage.addEventListener( "rise-cache-error", function( e ) {
      var fileUrl = ( e.detail && e.detail.request && e.detail.request.url ) ? e.detail.request.url : null,
        params = {
          "event": "error",
          "event_details": "rise cache error",
          "error_details": e.detail.error.message,
          "file_url": fileUrl
        },
        statusCode = 0,
        errorMessage;

      // log the error
      imageUtils.logEvent( params );

      if ( riseCache.isV2Running() ) {
        errorMessage = riseCache.getErrorMessage( statusCode );
      } else {
        // Show a different message if there is a 404 coming from rise cache
        if ( e.detail.error.message ) {
          statusCode = +e.detail.error.message.substring( e.detail.error.message.indexOf( ":" ) + 2 );
        }

        errorMessage = utils.getRiseCacheErrorMessage( statusCode );
      }

      // show the error
      RiseVision.Image.showError( errorMessage );
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

      imageUtils.logEvent( params );

      if ( e.detail && e.detail.isPlayerRunning ) {
        RiseVision.Image.showError( "Waiting for Rise Cache", true );
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

    envVerifierParams && storage.setAttribute( "endpointType", envVerifierParams.endpoint_type );
    envVerifierParams && storage.setAttribute( "viewerId", envVerifierParams.viewer_id );

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
