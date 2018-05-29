/* global localMessaging, playerLocalStorage, _ */
/* eslint-disable no-console */

var RiseVision = RiseVision || {};

RiseVision.ImageRLS = RiseVision.ImageRLS || {};

RiseVision.ImageRLS.PlayerLocalStorageFolder = function() {
  "use strict";

  var INITIAL_PROCESSING_DELAY = 15000,
    imageUtils = RiseVision.ImageUtils,
    messaging = new localMessaging.default(),
    folderPath = "",
    storage = null,
    watchInitiated = false,
    files = [],
    initialProcessingTimer = null,
    initialLoad = true;

  function _manageFile( data, state ) {
    var filePath = data.filePath,
      fileUrl = data.fileUrl,
      managedFile = _.find( files, function( file ) {
        return file.filePath === filePath;
      } );

    if ( state.toUpperCase() === "AVAILABLE" ) {
      if ( !managedFile ) {
        managedFile = {
          filePath: filePath,
          fileUrl: fileUrl,
          name: imageUtils.getStorageFileName( filePath )
        };

        // add this file to list
        files.push( managedFile );
      } else {
        // file has been updated
        managedFile.fileUrl = fileUrl
      }
    }

    if ( state.toUpperCase() === "DELETED" ) {
      if ( managedFile ) {
        files = _.reject( files, function( file ) {
          return file.filePath === filePath;
        } );
      }
    }

    files = _.sortBy( files, function( file ) {
      return file.name.toLowerCase();
    } );
  }

  function _clearInitialProcessingTimer() {
    clearTimeout( initialProcessingTimer );
    initialProcessingTimer = null;
  }

  function _startInitialProcessingTimer() {
    initialProcessingTimer = setTimeout( function() {
      if ( files.length < 1 ) {
        // files are still processing/downloading
        RiseVision.ImageRLS.onFileUnavailable( "Files are downloading" );
        return;
      }

      // settling with 1 file in case the folder only has 1 file
      initialLoad = false;
      RiseVision.ImageRLS.onFileInit( files );
    }, INITIAL_PROCESSING_DELAY );
  }

  function _handleNoConnection() {
    imageUtils.logEvent( {
      "event": "error",
      "event_details": "no connection"
    }, true );

    RiseVision.ImageRLS.showError( "There was a problem retrieving the file." );
  }

  function _handleRequiredModulesUnavailable() {
    imageUtils.logEvent( {
      "event": "error",
      "event_details": "required modules unavailable"
    }, true );

    RiseVision.ImageRLS.showError( "There was a problem retrieving the file." );
  }

  function _handleUnauthorized() {
    imageUtils.logEvent( {
      "event": "error",
      "event_details": "unauthorized"
    }, true );

    RiseVision.ImageRLS.showError( "Rise Storage subscription is not active." );
  }

  function _handleAuthorized() {
    if ( !watchInitiated ) {
      // start watching the folder
      storage.watchFiles( folderPath );
      watchInitiated = true;
    }
  }

  function _handleFileProcessing() {
    if ( initialLoad && !initialProcessingTimer ) {
      _startInitialProcessingTimer();
    }
  }

  function _handleFileAvailable( data ) {
    _manageFile( data, "available" );

    if ( initialLoad ) {
      /* Try to wait for at least 2 files to load before initializing the slider. Otherwise, the
         revolution.slide.onchange event will never fire, and this event is used to check whether or not the slider should refresh.
         If there's only 1 file in the folder, the initialProcessingTimer will ensure the slider does get initialized anyway
      */
      if ( files.length > 1 ) {
        _clearInitialProcessingTimer();
        initialLoad = false;

        RiseVision.ImageRLS.onFileInit( files );
      }

      return;
    }

    RiseVision.ImageRLS.onFileRefresh( files );
  }

  function _handleFolderNoExist() {
    var params = {
      "event": "error",
      "event_details": "folder does not exist"
    };

    imageUtils.logEvent( params, true );

    RiseVision.ImageRLS.showError( "The selected folder does not exist or has been moved to Trash." );
  }

  function _handleFileDeleted( data ) {
    _manageFile( data, "deleted" );

    imageUtils.logEvent( {
      "event": "file deleted"
    } );
  }

  function _handleFileError( data ) {
    // TODO: coming soon
    console.log( "handle file error!", data );
  }

  function _handleEvents( data ) {
    if ( !data || !data.event || typeof data.event !== "string" ) {
      return;
    }

    switch ( data.event.toUpperCase() ) {
    case "NO-CONNECTION":
      _handleNoConnection();
      break;
    case "REQUIRED-MODULES-UNAVAILABLE":
      _handleRequiredModulesUnavailable();
      break;
    case "AUTHORIZED":
      _handleAuthorized();
      break;
    case "UNAUTHORIZED":
      _handleUnauthorized();
      break;
    case "FILE-AVAILABLE":
      _handleFileAvailable( data );
      break;
    case "FILE-PROCESSING":
      _handleFileProcessing();
      break;
    case "FOLDER-NO-EXIST":
      _handleFolderNoExist();
      break;
    case "FILE-DELETED":
      _handleFileDeleted( data );
      break;
    case "FILE-ERROR":
      _handleFileError( data );
      break;
    }
  }

  function init() {
    folderPath = imageUtils.getStorageFolderPath();
    storage = new playerLocalStorage.default( messaging, _handleEvents );
  }

  function retry() {
    _handleFileProcessing();
  }

  return {
    "init": init,
    "retry": retry
  };
};
