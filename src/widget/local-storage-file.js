var RiseVision = RiseVision || {};

RiseVision.Image = RiseVision.Image || {};

RiseVision.Image.LocalStorageFile = function() {
  "use strict";

  var wsClient = RiseVision.Common.WSClient,
    testGCSImage = "local-storage-test/test-1x1.png",
    watchMessageAlreadySent = false,
    testImageDownloaded = false;

  function _clientListHandler( message ) {
    var clients = message.clients;

    if ( !watchMessageAlreadySent ) {
      if ( clients.includes( "local-storage" ) ) {
        // log that LS is present
        RiseVision.Image.logEvent( {
          "event": "LS is present",
          "file_url": testGCSImage
        } );

        // send test WATCH for test image file on GCS bucket configured with Pub/Sub
        wsClient.broadcastMessage( {
          "topic": "WATCH",
          "filePath": testGCSImage
        } );

        watchMessageAlreadySent = true;
      } else {
        // log that LS is not present (yet)
        RiseVision.Image.logEvent( {
          "event": "LS is not present",
          "file_url": testGCSImage
        } );
      }
    }
  }

  function _fileUpdateHandler( message ) {
    var imgTest = null;

    // log successful test of receiving FILE-UPDATE message
    RiseVision.Image.logEvent( {
      "event": "Test image FILE-UPDATE",
      "event_details": JSON.stringify( message ),
      "file_url": message.filePath
    } );

    // test downloading the image
    if ( !testImageDownloaded && message.ospath ) {
      imgTest.onload = function() {
        RiseVision.Image.logEvent( {
          "event": "Test image downloaded",
          "file_url": message.ospath
        } );
      };

      imgTest.onerror = function() {
        RiseVision.Image.logEvent( {
          "event": "Test image download failed",
          "file_url": message.ospath
        } );
      };

      imgTest.src = message.ospath;
      testImageDownloaded = true;
    }
  }

  function _fileErrorHandler( message ) {
    RiseVision.Image.logEvent( {
      "event": "Test image FILE-ERROR",
      "event_details": JSON.stringify( message ),
      "file_url": message.filePath
    } );
  }

  function init() {
    if ( wsClient.canConnect() ) {

      wsClient.receiveMessages( function( message ) {
        if ( !message || !message.topic ) {
          RiseVision.Image.logEvent( {
            "event": "Invalid LMS message received",
            "event_details": JSON.stringify( message ),
            "file_url": testGCSImage
          } );

          return;
        }

        switch ( message.topic.toUpperCase() ) {
        case "CLIENT-LIST":
          return _clientListHandler( message );
        case "FILE-UPDATE":
          return _fileUpdateHandler( message );
        case "FILE-ERROR":
          return _fileErrorHandler( message );
        }
      } );
    }
  }

  return {
    "init": init
  };
};
