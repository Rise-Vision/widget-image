/* global requests, suiteSetup, suite, suiteTeardown, setup, teardown, test, assert, RiseVision, sinon, config */

/* eslint-disable func-names */

var ready = false,
  isV2Running = false,
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
  if ( isV2Running ) {
    requests[ 0 ].respond( 404 );
    requests[ 1 ].respond( 200 );
  } else {
    requests[ 0 ].respond( 200 );
  }

  check( done );
} );

suite( "initialize", function() {

  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "added": true,
        "name": "widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGone_Girl_Book_Cover.jpg?alt=media"
      },
      "bubbles": true
    } ) );

    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "added": true,
        "name": "widget-testing/image-widget/Gated_Book_Cover.jpg",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGated_Book_Cover.jpg?alt=media"
      },
      "bubbles": true
    } ) );
  } );

  test( "should set fileType attribute of storage component", function() {
    assert.equal( storage.filetype, "image" );
  } );

  test( "should set folder attribute of storage component", function() {
    assert.equal( storage.folder, "widget-testing/image-widget/" );
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

  test( "should scale image to fit", function() {
    assert.equal( document.querySelector( ".tp-bgimg" ).getAttribute( "data-bgfit" ), "contain" );
  } );

  test( "should align image at top left", function() {
    assert.equal( document.querySelector( ".tp-bgimg" ).getAttribute( "data-bgposition" ), "left top" );
  } );

  test( "should have left arrow", function() {
    assert.isNotNull( document.querySelector( ".tp-leftarrow" ) );
  } );

  test( "should have right arrow", function() {
    assert.isNotNull( document.querySelector( ".tp-rightarrow" ) );
  } );

  test( "should add correct number of images to slider", function() {
    assert.equal( document.querySelectorAll( ".tp-revslider-mainul .tp-revslider-slidesli" ).length, 2 );
  } );

  test( "should add images in alphabetical order", function() {
    assert.equal( document.querySelector( ".tp-revslider-mainul .tp-revslider-slidesli:nth-child(1) .tp-bgimg" ).getAttribute( "data-lazyload" ), "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGated_Book_Cover.jpg?alt=media", "first slide" );

    assert.equal( document.querySelector( ".tp-revslider-mainul .tp-revslider-slidesli:nth-child(2) .tp-bgimg" ).getAttribute( "data-lazyload" ), "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGone_Girl_Book_Cover.jpg?alt=media", "second slide" );
  } );

} );

suite( "added", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "added": true,
        "name": "widget-testing/image-widget/The_Girl_On_The_Train_Cover.jpg",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/o/images%2FThe_Girl_On_The_Train_Cover.jpg?alt=media"
      },
      "bubbles": true
    } ) );
  } );

  test( "should add image", function( done ) {
    setTimeout( function() {
      assert.equal( document.querySelectorAll( ".tp-revslider-mainul .tp-revslider-slidesli" ).length, 3, "num of slides" );
      assert.equal( document.querySelector( ".tp-revslider-mainul .tp-revslider-slidesli:nth-child(3) .tp-bgimg" ).getAttribute( "data-lazyload" ), "https://www.googleapis.com/storage/v1/b/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/o/images%2FThe_Girl_On_The_Train_Cover.jpg?alt=media" );
      done();
    }, 8000 );
  } );
} );

suite( "changed", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "changed": true,
        "name": "widget-testing/image-widget/Gated_Book_Cover.jpg",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGated_Book_Cover.jpg?alt=media&cb=0"
      },
      "bubbles": true
    } ) );
  } );

  test( "should update image", function( done ) {
    setTimeout( function() {
      assert.equal( document.querySelectorAll( ".tp-revslider-mainul .tp-revslider-slidesli" ).length, 3, "num of slides" );
      assert.equal( document.querySelector( ".tp-revslider-mainul .tp-revslider-slidesli:nth-child(1) .tp-bgimg" ).getAttribute( "src" ), "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGated_Book_Cover.jpg?alt=media&cb=0" );
      done();
    }, 8000 );
  } );
} );

suite( "unchanged", function() {
  var refreshStub;

  suiteSetup( function() {
    refreshStub = sinon.stub( RiseVision.Image, "onFileRefresh" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "changed": false,
        "name": "widget-testing/image-widget/Gated_Book_Cover.jpg",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGated_Book_Cover.jpg?alt=media&cb=0"
      },
      "bubbles": true
    } ) );
  } );

  suiteTeardown( function() {
    RiseVision.Image.onFileRefresh.restore();
  } );

  test( "Should not call onFileRefresh when files have not changed", function() {
    assert( refreshStub.notCalled );
  } );

} );

suite( "delete", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "deleted": true,
        "name": "widget-testing/image-widget/Gated_Book_Cover.jpg",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGated_Book_Cover.jpg?alt=media&cb=0"
      },
      "bubbles": true
    } ) );
  } );

  test( "should delete image", function( done ) {
    setTimeout( function() {
      assert.equal( document.querySelectorAll( ".tp-revslider-mainul .tp-revslider-slidesli" ).length, 2, "number of slides" );
      assert.equal( document.querySelector( ".tp-revslider-mainul .tp-revslider-slidesli:nth-child(1) .tp-bgimg" ).getAttribute( "src" ), "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGone_Girl_Book_Cover.jpg?alt=media", "slide" );
      done();
    }, 5000 );
  } );
} );

suite( "network recovery", function() {
  test( "should call onFileRefresh() if in state of storage error and network recovered", function() {
    var onRefreshStub = sinon.stub( RiseVision.Image, "onFileRefresh", function() {} );

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
        "name": "widget-testing/image-widget/Gated_Book_Cover.jpg",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGated_Book_Cover.jpg?alt=media&cb=0"
      },
      "bubbles": true
    } ) );

    assert( onRefreshStub.calledOnce );

    RiseVision.Image.onFileRefresh.restore();
  } );
} );

suite( "storage errors", function() {
  var params = { "event": "" },
    onShowErrorStub,
    onLogEventStub;

  setup( function() {
    onShowErrorStub = sinon.stub( RiseVision.Image, "showError", function() {} );
    onLogEventStub = sinon.stub( RiseVision.Image, "logEvent", function() {} );
  } );

  teardown( function() {
    delete params.url;
    delete params.event_details;

    RiseVision.Image.showError.restore();
    RiseVision.Image.logEvent.restore();
  } );

  test( "should handle when a 'rise cache not running' occurs", function() {
    params.event = "error";
    params.event_details = "rise cache not running";
    params.error_details = "The request failed with status code: 404";

    delete params.file_url;

    if ( isV2Running ) {
      storage.dispatchEvent( new CustomEvent( "rise-cache-not-running", {
        "detail": {
          "resp": {
            "error": {
              "message": "The request failed with status code: 404"
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
            "message": "The request failed with status code: 404"
          }
        },
        "bubbles": true
      } ) );
    }

    assert( onLogEventStub.calledOnce, "logEvent() called once" );
    assert( onLogEventStub.calledWith( params, true ), "logEvent() called with correct params" );

  } );
} );
