/* global localMessaging, playerLocalStorage, _ */
/* eslint-disable no-console */

var RiseVision = RiseVision || {};

RiseVision.ImageRLS = RiseVision.ImageRLS || {};

RiseVision.ImageRLS.PlayerLocalStorageFolder = function() {
  "use strict";

  var INITIAL_PROCESSING_DELAY = 15000,
    imageUtils = RiseVision.ImageUtils,
    messaging = new localMessaging.default(),
    defaultFileFormat = "unknown",
    folderPath = "",
    storage = null,
    watchInitiated = false,
    files = [],
    filesInError = [],
    initialProcessingTimer = null,
    initialLoad = true;

  function _getFileInError( filePath ) {
    return _.find( filesInError, function( file ) {
      return file.filePath === filePath;
    } );
  }

  function _getFile( filePath ) {
    return _.find( files, function( file ) {
      return file.filePath === filePath;
    } );
  }

  function _manageFileInError( data, fixed ) {
    var filePath = data.filePath,
      fileInError = _.find( filesInError, function( file ) {
        return file.filePath === filePath;
      } );

    if ( !filePath ) {
      return;
    }

    if ( fixed && fileInError ) {
      // remove this file from files in error list
      filesInError = _.reject( filesInError, function( file ) {
        return file.filePath === filePath;
      } );
    } else if ( !fixed ) {
      if ( !fileInError ) {
        fileInError = {
          filePath: filePath,
          params: data.params
        };
        // add this file to list of files in error
        filesInError.push( fileInError );
      } else {
        fileInError.params = _.clone( data.params );
      }
    }
  }

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
          url: fileUrl,
          name: imageUtils.getStorageFileName( filePath )
        };

        // add this file to list
        files.push( managedFile );
      } else {
        // file has been updated
        managedFile.url = fileUrl
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

  function _onFileRemoved() {
    if ( files.length < 1 ) {
      // No files to show anymore, log and display a message
      imageUtils.logEvent( {
        "event": "warning",
        "event_details": "No files to display",
        "file_url": folderPath,
        "file_format": "unknown"
      } );

      RiseVision.ImageRLS.showError( "Unable to display any files." );
    } else {
      RiseVision.ImageRLS.onFileRefresh( files );
    }
  }

  function _clearInitialProcessingTimer() {
    clearTimeout( initialProcessingTimer );
    initialProcessingTimer = null;
  }

  function _startInitialProcessingTimer() {
    initialProcessingTimer = setTimeout( function() {
      // explicitly set to null for integration test purposes
      initialProcessingTimer = null;

      if ( files.length < 1 ) {
        if ( filesInError.length > 0 ) {
          // Some files during initial processing had a file error and no files became available
          imageUtils.logEvent( {
            "event": "warning",
            "event_details": "No files to display (startup)",
            "file_url": folderPath,
            "file_format": "unknown"
          } );

          RiseVision.ImageRLS.showError( "Unable to download any files." );
          return;
        }

        // files are still processing/downloading
        RiseVision.ImageRLS.onFileUnavailable( "Files are downloading." );
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
      "event_details": "no connection",
      "file_url": folderPath,
      "file_format": defaultFileFormat
    } );

    RiseVision.ImageRLS.showError( "There was a problem retrieving the files." );
  }

  function _handleRequiredModulesUnavailable() {
    imageUtils.logEvent( {
      "event": "error",
      "event_details": "required modules unavailable",
      "file_url": folderPath,
      "file_format": defaultFileFormat
    } );

    RiseVision.ImageRLS.showError( "There was a problem retrieving the files." );
  }

  function _handleUnauthorized() {
    imageUtils.logEvent( {
      "event": "error",
      "event_details": "unauthorized",
      "file_url": folderPath,
      "file_format": defaultFileFormat
    } );

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
    _manageFileInError( data, true );

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
      "event_details": "folder does not exist",
      "file_url": folderPath,
      "file_format": defaultFileFormat
    };

    imageUtils.logEvent( params );

    RiseVision.ImageRLS.showError( "The selected folder does not exist or has been moved to Trash." );
  }

  function _handleFolderEmpty() {
    var params = {
      "event": "warning",
      "event_details": "folder empty",
      "file_url": folderPath,
      "file_format": defaultFileFormat
    };

    imageUtils.logEvent( params );

    RiseVision.ImageRLS.showError( "The selected folder does not contain any images." );
  }

  function _handleFileDeleted( data ) {
    var file = _getFile( data.filePath ),
      params = {
        "event": "file deleted",
        "file_url": data.filePath,
        "local_url": ( file && file.url ) ? file.url : ""
      };

    _manageFile( data, "deleted" );
    _manageFileInError( data, true );

    imageUtils.logEvent( params );

    if ( !initialLoad && !initialProcessingTimer ) {
      _onFileRemoved();
    }
  }

  function _handleFileError( data ) {
    var msg = data.msg || "",
      detail = data.detail || "",
      params = {
        "event": "error",
        "event_details": msg,
        "error_details": detail,
        "file_url": data.filePath
      },
      fileInError = _getFileInError( data.filePath );

    // prevent repetitive logging when widget is receiving messages from other potential widget instances watching same file
    if ( fileInError && _.isEqual( params, fileInError.params ) ) {
      return;
    }

    _manageFileInError( {
      filePath: data.filePath,
      params: _.clone( params )
    } );

    /*** Possible error messages from Local Storage ***/
    /*
      "File's host server could not be reached"

      "File I/O Error"

      "Could not retrieve signed URL"

      "Insufficient disk space"

      "Invalid response with status code [CODE]"
     */

    imageUtils.logEvent( params );

    if ( !initialLoad && !initialProcessingTimer ) {
      if ( _getFile( data.filePath ) ) {
        // remove this file from the file list since there was a problem with its new version being provided
        _manageFile( { filePath: data.filePath }, "deleted" );
        _onFileRemoved();
      }
    }
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
    case "FOLDER-EMPTY":
      _handleFolderEmpty();
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
    if ( initialLoad && !initialProcessingTimer ) {
      _startInitialProcessingTimer();
    }
  }

  return {
    "init": init,
    "retry": retry
  };
};
