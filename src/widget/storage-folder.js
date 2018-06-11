/* global config, _ */

var RiseVision = RiseVision || {};

RiseVision.Image = RiseVision.Image || {};

RiseVision.Image.StorageFolder = function( data, displayId ) {
  "use strict";

  var utils = RiseVision.Common.Utilities,
    imageUtils = RiseVision.ImageUtils,
    riseCache = RiseVision.Common.RiseCache,
    _isLoading = true,
    _files = [],
    _timer = null;

  function processUrl( e ) {
    var file;

    if ( e.detail ) {

      // Image has been added.
      if ( e.detail.added ) {
        _files.push( {
          "name": e.detail.name,
          "url": e.detail.url
        } );
      }

      // Image has been changed.
      if ( e.detail.changed ) {
        file = _.find( _files, function( file ) {
          return file.name === e.detail.name;
        } );

        file.url = e.detail.url;
      }

      // Image has been deleted.
      if ( e.detail.deleted ) {
        _files = _.reject( _files, function( file ) {
          return file.name === e.detail.name;
        } );
      }
    }

    _files = _.sortBy( _files, function( file ) {
      return file.name.toLowerCase();
    } );
  }

  function handleResponse( e ) {
    processUrl( e );

    // Image has been added.
    if ( e.detail.added ) {
      if ( _isLoading ) {
        // Need to wait for at least 2 images to load before initializing the slider.
        // Otherwise, the revolution.slide.onchange event will never fire, and this event is used
        // to check whether or not the slider should refresh.
        if ( _files.length > 1 ) {
          _isLoading = false;

          clearTimeout( _timer );
          RiseVision.Image.onFileInit( _files );
        } else {
          // Set a timeout in case there is only one image in the folder.
          _timer = setTimeout( function() {
            _isLoading = false;
            RiseVision.Image.onFileInit( _files );
          }, 5000 );
        }

        return;
      }
    }

    // Unchanged
    if ( e.detail.hasOwnProperty( "changed" ) && !e.detail.changed ) {
      // in the event of a network failure and recovery, check if the Widget is in a state of storage error
      if ( !RiseVision.Image.hasStorageError() ) {
        // only proceed with refresh logic below if there's been a storage error, otherwise do nothing
        // this is so the Widget can eventually play slideshow again from a network recovery
        return;
      }
    }

    RiseVision.Image.onFileRefresh( _files );
  }

  /*
   *  Public Methods
   */
  function init() {
    var storage = document.querySelector( "rise-storage" );

    storage.addEventListener( "rise-storage-response", handleResponse );

    storage.addEventListener( "rise-storage-api-error", function( e ) {
      var params = {
        "event": "error",
        "event_details": "storage api error",
        "error_details": "Response code: " + e.detail.code + ", message: " + e.detail.message
      };

      imageUtils.logEvent( params );
      RiseVision.Image.showError( "Sorry, there was a problem communicating with Rise Storage." );
    } );

    storage.addEventListener( "rise-storage-empty-folder", function() {
      var params = {
        "event": "error",
        "event_details": "storage folder empty"
      };

      imageUtils.logEvent( params );
      RiseVision.Image.showError( "The selected folder does not contain any images." );
    } );

    storage.addEventListener( "rise-storage-no-folder", function( e ) {
      var params = {
        "event": "error",
        "event_details": "storage folder doesn't exist",
        "error_details": e.detail
      };

      imageUtils.logEvent( params );
      RiseVision.Image.showError( "The selected folder does not exist or has been moved to Trash." );
    } );


    storage.addEventListener( "rise-storage-folder-invalid", function() {
      var params = {
        "event": "error",
        "event_details": "storage folder format(s) invalid"
      };

      imageUtils.logEvent( params );
      RiseVision.Image.showError( "The selected folder does not contain any supported image formats." );
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
      var params = {
        "event": "rise storage error",
        "event_details": "The request failed with status code: " + e.detail.error.currentTarget.status
      };

      imageUtils.logEvent( params );
      RiseVision.Image.showError( "Sorry, there was a problem communicating with Rise Storage.", true );
    } );

    storage.addEventListener( "rise-cache-error", function( e ) {
      var params = {
          "event": "rise cache error",
          "event_details": e.detail.error.message
        },
        statusCode = 0,
        errorMessage;

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

    storage.setAttribute( "fileType", "image" );
    storage.setAttribute( "companyId", data.storage.companyId );
    storage.setAttribute( "displayId", displayId );
    storage.setAttribute( "folder", data.storage.folder );
    storage.setAttribute( "env", config.STORAGE_ENV );

    storage.go();
  }

  return {
    "init": init
  };
};
