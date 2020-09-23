/* global requests, suiteSetup, suite, setup, teardown, test, assert,
 RiseVision, sinon, config */

/* eslint-disable func-names */

var ready = false,
  isV2Running = false,
  refreshSpy = null,
  requests,
  storage,
  check = function( done ) {
    if ( ready ) {
      done();
    } else {
      setTimeout( function() {
        check( done )
      }, 1000 );
    }
  };

suiteSetup( function( done ) {
  check( done );
} );

suite( "file added", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "added": true,
        "name": "widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGone_Girl_Book_Cover.jpg?alt=media"
      },
      "bubbles": true
    } ) );
  } );

  test( "should set folder attribute of storage component", function() {
    assert.equal( storage.folder, "widget-testing/image-widget/" );
  } );

  test( "should set filename attribute of storage component", function() {
    assert.equal( storage.filename, "Gone_Girl_Book_Cover.jpg" );
  } );

  test( "should set companyid attribute of storage component", function() {
    assert.equal( storage.companyid, "30007b45-3df0-4c7b-9f7f-7d8ce6443013" );
  } );

  test( "should set displayid attribute of storage component", function() {
    assert.equal( storage.displayid, "\"displayId\"" );
  } );

  test( "should set env attribute of storage component", function() {
    assert.equal( storage.env, config.STORAGE_ENV );
  } );

  test( "should align image at top left", function() {
    assert.isNotNull( document.querySelector( ".top-left" ) );
  } );

  test( "should scale image to fit", function() {
    assert.isNotNull( document.querySelector( ".scale-to-fit" ) );
  } );

  test( "should set background image", function( done ) {
    setTimeout( function() {
      assert.equal( document.getElementById( "image" ).style.backgroundImage,
        "url(\"https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGone_Girl_Book_Cover.jpg?alt=media\")" );
      done();
    }, 3000 );
  } );
} );

suite( "visibility", function() {

  test( "should hide .gif when paused", function( done ) {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "changed": true,
        "name": "widget-testing/image-widget/bells.gif",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2Fbells.gif?alt=media&cb=0"
      },
      "bubbles": true
    } ) );

    setTimeout( function() {
      RiseVision.Image.pause();
      assert.equal( document.getElementById( "image" ).style.visibility, "hidden" );
      done();
    }, 3000 );

  } );

  test( "should show .gif when played", function() {
    RiseVision.Image.play();

    assert.equal( document.getElementById( "image" ).style.visibility, "visible" );

  } );

} );

suite( "file changed", function() {
  setup( function() {
    refreshSpy = sinon.spy( RiseVision.Image, "onFileRefresh" );
  } )

  teardown( function() {
    RiseVision.Image.onFileRefresh.restore();
  } );

  test( "should call onFileRefresh() and set background image", function( done ) {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "changed": true,
        "name": "widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGone_Girl_Book_Cover.jpg?alt=media&cb=0"
      },
      "bubbles": true
    } ) );

    assert( refreshSpy.calledOnce );
    setTimeout( function() {
      assert.equal( document.getElementById( "image" ).style.backgroundImage,
        "url(\"https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGone_Girl_Book_Cover.jpg?alt=media&cb=0\")" );
      done();
    }, 3000 );
  } );
} );

suite( "special characters in file name", function() {
  setup( function() {
    refreshSpy = sinon.spy( RiseVision.Image, "onFileRefresh" );
  } );

  teardown( function() {
    RiseVision.Image.onFileRefresh.restore();
  } );

  test( "should show image with single quote in file name", function( done ) {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "changed": true,
        "name": "widget-testing/image-widget/special-characters/Simpson's.png",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2Fspecial-characters%2FSimpson's.png?alt=media"
      },
      "bubbles": true
    } ) );

    assert( refreshSpy.calledOnce );
    setTimeout( function() {
      assert.equal( document.getElementById( "image" ).style.backgroundImage,
        "url(\"https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2Fspecial-characters%2FSimpson's.png?alt=media\")" );
      done();
    }, 3000 );
  } );

  test( "should show image with parentheses in file name", function( done ) {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "changed": true,
        "name": "widget-testing/image-widget/special-characters/weather-background (1).png",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2Fspecial-characters%2Fweather-background%20(1).png?alt=media"
      },
      "bubbles": true
    } ) );

    assert( refreshSpy.calledOnce );
    setTimeout( function() {
      assert.equal( document.getElementById( "image" ).style.backgroundImage,
        "url(\"https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2Fspecial-characters%2Fweather-background%20(1).png?alt=media\")" );
      done();
    }, 3000 );
  } );
} );

suite( "file unchanged", function() {
  setup( function() {
    refreshSpy = sinon.spy( RiseVision.Image, "onFileRefresh" );
  } )

  teardown( function() {
    RiseVision.Image.onFileRefresh.restore();
  } );

  test( "should not call onFileRefresh() when file has not changed", function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "changed": false,
        "name": "Widgets/simpsons.jpg",
        "url": "https://storage.googleapis.com/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/Widgets%2Fsimpsons.jpg"
      },
      "bubbles": true
    } ) );

    assert( refreshSpy.notCalled );
  } );

} );

suite( "storage errors", function() {
  var params = { "event": "" },
    onShowErrorStub,
    onLogEventStub;

  setup( function() {
    onShowErrorStub = sinon.stub( RiseVision.Image, "showError", function() {} );
    onLogEventStub = sinon.stub( RiseVision.ImageUtils, "logEvent", function() {} );
  } );

  teardown( function() {
    delete params.url;
    delete params.event_details;

    RiseVision.Image.showError.restore();
    RiseVision.ImageUtils.logEvent.restore();
  } );

  test( "should handle when 'storage api' error occurs", function() {
    params.event = "error";
    params.event_details = "storage api error";
    params.error_details = "Response code: 500, message: Could not retrieve Bucket Items";

    storage.dispatchEvent( new CustomEvent( "rise-storage-api-error", {
      "detail": {
        "result": false,
        "code": 500,
        "message": "Could not retrieve Bucket Items"
      },
      "bubbles": true
    } ) );

    assert( onLogEventStub.calledOnce, "logEvent() called once" );
    assert( onLogEventStub.calledWith( params ), "logEvent() called with correct params" );
    assert( onShowErrorStub.calledOnce, "showError() called once" );
    assert( onShowErrorStub.calledWith( "Sorry, there was a problem communicating with Rise Storage." ),
      "showError() called with correct message" );
  } );

  test( "should handle when 'no file' error occurs", function() {
    var filePath = window.gadget.settings.additionalParams.storage.folder + "/" + window.gadget.settings.additionalParams.storage.fileName;

    params.event = "error";
    params.event_details = "storage file not found";
    params.file_url = filePath;

    delete params.error_details;

    storage.dispatchEvent( new CustomEvent( "rise-storage-no-file", {
      "detail": filePath,
      "bubbles": true
    } ) );

    assert( onLogEventStub.calledOnce, "logEvent() called once" );
    assert( onLogEventStub.calledWith( params ), "logEvent() called with correct params" );
    assert( onShowErrorStub.calledOnce, "showError() called once" );
    assert( onShowErrorStub.calledWith( "The selected image does not exist or has been moved to Trash." ),
      "showError() called with correct message" );
  } );

  test( "should handle when 'file throttled' error occurs", function() {
    params.event = "error";
    params.event_details = "storage file throttled";
    params.file_url = window.gadget.settings.additionalParams.url;

    storage.dispatchEvent( new CustomEvent( "rise-storage-file-throttled", {
      "detail": window.gadget.settings.additionalParams.url,
      "bubbles": true
    } ) );

    assert( onLogEventStub.calledOnce, "logEvent() called once" );
    assert( onLogEventStub.calledWith( params ), "logEvent() called with correct params" );
    assert( onShowErrorStub.calledOnce, "showError() called once" );
    assert( onShowErrorStub.calledWith( "The selected image is temporarily unavailable." ),
      "showError() called with correct message" );
  } );

  test( "should handle when a rise storage error occurs", function() {
    params.event = "error";
    params.event_details = "rise storage error";
    params.error_details = "The request failed with status code: 0";
    params.file_url = null;

    storage.dispatchEvent( new CustomEvent( "rise-storage-error", {
      "detail": {
        "error": {
          "currentTarget": {
            "status": 0
          }
        } },
      "bubbles": true
    } ) );

    assert( onLogEventStub.calledOnce, "logEvent() called once" );
    assert( onLogEventStub.calledWith( params ), "logEvent() called with correct params" );
    assert( onShowErrorStub.calledOnce, "showError() called once" );
    assert( onShowErrorStub.calledWith( "Sorry, there was a problem communicating with Rise Storage." ),
      "showError() called with correct message" );
  } );

  test( "should handle when a rise cache error occurs", function() {
    params.event = "error";
    params.event_details = "rise cache error";
    params.error_details = "The request failed with status code: 500";
    params.file_url = null;

    storage.dispatchEvent( new CustomEvent( "rise-cache-error", {
      "detail": {
        "error": {
          "message": "The request failed with status code: 500"
        } },
      "bubbles": true
    } ) );

    assert( onLogEventStub.calledOnce, "logEvent() called once" );
    assert( onLogEventStub.calledWith( params ), "logEvent() called with correct params" );
    assert( onShowErrorStub.calledOnce, "showError() called once" );
    assert( onShowErrorStub.calledWith( "There was a problem retrieving the file from Rise Cache." ),
      "showError() called with correct message" );
  } );

  test( "should handle when a 'rise cache not running' occurs", function() {
    params.event = "error";
    params.event_details = "rise cache not running";
    params.error_details = "The request failed with status code: 500";

    delete params.file_url;

    if ( isV2Running ) {
      storage.dispatchEvent( new CustomEvent( "rise-cache-not-running", {
        "detail": {
          "resp": {
            "error": {
              "message": "The request failed with status code: 500"
            }
          },
          "isPlayerRunning": true
        },
        "bubbles": true
      } ) );

      assert( onShowErrorStub.calledOnce, "showError() called once" );
      assert( onShowErrorStub.calledWith( "Waiting for Rise Cache" ),
        "showError() called with correct message" );

    } else {
      storage.dispatchEvent( new CustomEvent( "rise-cache-not-running", {
        "detail": {
          "error": {
            "message": "The request failed with status code: 500"
          }
        },
        "bubbles": true
      } ) );
    }

    assert( onLogEventStub.calledOnce, "logEvent() called once" );
    assert( onLogEventStub.calledWith( params ), "logEvent() called with correct params" );

  } );

} );

suite( "Network Recovery", function() {
  setup( function() {
    refreshSpy = sinon.spy( RiseVision.Image, "onFileRefresh" );
  } )

  teardown( function() {
    RiseVision.Image.onFileRefresh.restore();
  } );

  test( "should call onFileRefresh() if in state of storage error and network recovered", function() {
    // force a storage error in the scenario of a network failure
    storage.dispatchEvent( new CustomEvent( "rise-storage-error", {
      "detail": {
        "error": {
          "currentTarget": {
            "status": 0
          }
        } },
      "bubbles": true
    } ) );

    // force a response in the scenario of the network recovered
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "changed": false,
        "name": "Widgets/simpsons.jpg",
        "url": "https://storage.googleapis.com/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/Widgets%2Fsimpsons.jpg"
      },
      "bubbles": true
    } ) );

    assert( refreshSpy.calledOnce );
  } );
} );
