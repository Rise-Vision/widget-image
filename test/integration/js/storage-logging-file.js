/* global requests, suiteSetup, suite, teardown, test, assert, RiseVision, sinon */

/* eslint-disable func-names */

var table = "image_events",
  params = {
    "event": "error",
    "event_details": "rise storage error",
    "error_details": "The request failed with status code: 404",
    "file_url": "http://localhost:9494/?url=https%3A%2F%2Fstorage.googleapis.com%2Frisemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443%2FWidgets%2Fsimpson's.jpg",
    "file_format": "jpg",
    "company_id": "\"companyId\"",
    "display_id": "\"displayId\"",
    "version": "1.0.0"
  },
  ready = false,
  isV2Running = false,
  requests,
  storage,
  spy,
  clock,
  check = function( done ) {
    if ( ready ) {
      sinon.stub( RiseVision.Image, "play" );
      clock = sinon.useFakeTimers();

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

teardown( function() {
  RiseVision.Common.LoggerUtils.logEvent.restore();
} );

suite( "configuration", function() {

  test( "should log the configuration event", function() {

    assert( spy.calledWith( table, {
      "event": "configuration",
      "event_details": "storage file",
      "company_id": params.company_id,
      "display_id": params.display_id,
      "version": params.version
    } ) );

  } );
} );

suite( "rise storage error", function() {
  var spyCall;

  test( "should log a rise storage error", function() {
    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-error", {
      "detail": {
        "request": {
          "url": "http://localhost:9494/?url=https%3A%2F%2Fstorage.googleapis.com%2Frisemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443%2FWidgets%2Fsimpson's.jpg"
        },
        "error": {
          "currentTarget": {
            "status": 404
          }
        }
      },
      "bubbles": true
    } ) );

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

  test( "should log a rise storage error when done is fired", function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-error", {
      "detail": {
        "request": {
          "url": "http://localhost:9494/?url=https%3A%2F%2Fstorage.googleapis.com%2Frisemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443%2FWidgets%2Fsimpson's.jpg"
        },
        "error": {
          "currentTarget": {
            "status": 404
          }
        }
      },
      "bubbles": true
    } ) );

    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );
    clock.tick( 5000 );

    assert( spy.calledOnce );

    spyCall = RiseVision.Common.LoggerUtils.logEvent.getCall( 0 );

    assert.equal( spyCall.args[ 0 ], table );
    assert.deepEqual( spyCall.args[ 1 ], params );
  } );

  test( "should not log a rise storage error when done is fired if the error has resolved itself on a refresh", function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-error", {
      "detail": {
        "request": {
          "url": "http://localhost:9494/?url=https%3A%2F%2Fstorage.googleapis.com%2Frisemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443%2FWidgets%2Fsimpson's.jpg"
        },
        "error": {
          "currentTarget": {
            "status": 404
          }
        }
      },
      "bubbles": true
    } ) );

    // Resolve the error.
    RiseVision.Image.onFileRefresh( window.gadget.settings.additionalParams.selector.url );

    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    params.event = "done";
    params.file_url = null;
    delete params.error_details;
    delete params.event_details;
    delete params.file_format;

    clock.tick( 5000 );

    assert( spy.notCalled, "called once" );
  } );
} );

suite( "rise cache error", function() {

  test( "should log a rise cache not running when ping response is empty", function() {
    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    if ( isV2Running ) {
      storage.dispatchEvent( new CustomEvent( "rise-cache-not-running", {
        "detail": {
          "resp": null,
          "isPlayerRunning": true
        },
        "bubbles": true
      } ) );
    } else {
      storage.dispatchEvent( new CustomEvent( "rise-cache-not-running", null ) );
    }

    params.event = "error";
    params.event_details = "rise cache not running";
    params.error_details = "";
    delete params.file_url;
    delete params.file_format;

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

  test( "should log a rise cache not running when ping response is 404", function() {
    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

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

    params.event = "error";
    params.event_details = "rise cache not running";
    params.error_details = "The request failed with status code: 404";

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

  test( "should log a rise cache error", function() {
    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    storage.dispatchEvent( new CustomEvent( "rise-cache-error", {
      "detail": {
        "request": {
          "url": "http://localhost:9494/?url=https%3A%2F%2Fstorage.googleapis.com%2Frisemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443%2FWidgets%2Fsimpson's.jpg"
        },
        "error": {
          "message": "The request failed with status code: 404"
        }
      },
      "bubbles": true
    } ) );

    params.event = "error";
    params.event_details = "rise cache error";
    params.error_details = "The request failed with status code: 404";
    params.file_url = "http://localhost:9494/?url=https%3A%2F%2Fstorage.googleapis.com%2Frisemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443%2FWidgets%2Fsimpson's.jpg";
    params.file_format = "jpg";


    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

} );

suite( "storage api error", function() {
  var spyCall;

  test( "should log a storage api error", function() {
    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-api-error", {
      "detail": {
        "result": false,
        "code": 500,
        "message": "Could not retrieve Bucket Items"
      },
      "bubbles": true
    } ) );

    params.event_details = "storage api error";
    params.error_details = "Response code: 500, message: Could not retrieve Bucket Items";

    delete params.file_url;
    delete params.file_format;

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

  test( "should log a storage api error when done is fired", function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-api-error", {
      "detail": {
        "result": false,
        "code": 500,
        "message": "Could not retrieve Bucket Items"
      },
      "bubbles": true
    } ) );

    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );
    clock.tick( 5000 );
    assert( spy.calledOnce );

    spyCall = RiseVision.Common.LoggerUtils.logEvent.getCall( 0 );

    assert.equal( spyCall.args[ 0 ], table );
    assert.deepEqual( spyCall.args[ 1 ], params );
  } );

  test( "should not log a storage file not found error when done is fired if the error has resolved itself on a refresh", function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-no-file", {
      "detail": {
        "result": false,
        "code": 500,
        "message": "Could not retrieve Bucket Items"
      },
      "bubbles": true
    } ) );

    // Resolve the error.
    RiseVision.Image.onFileRefresh( window.gadget.settings.additionalParams.selector.url );

    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );
    params.event = "done";
    params.file_url = window.gadget.settings.additionalParams.selector.url;
    params.file_format = "jpg";
    delete params.event_details;
    delete params.error_details;

    clock.tick( 5000 );

    assert( spy.notCalled );
  } );

} );

suite( "storage file not found", function() {
  var spyCall;

  test( "should log a storage file not found error", function() {
    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-no-file", {
      "detail": "Widgets/simpson's.jpg",
      "bubbles": true
    } ) );

    params.event = "error";
    params.event_details = "storage file not found";
    params.file_url = "Widgets/simpson's.jpg";
    delete params.error_details;

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

  test( "should log a storage file not found error when done is fired", function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-no-file", {
      "detail": "Widgets/simpson's.jpg",
      "bubbles": true
    } ) );

    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );
    clock.tick( 5000 );
    assert( spy.calledOnce );

    spyCall = RiseVision.Common.LoggerUtils.logEvent.getCall( 0 );

    assert.equal( spyCall.args[ 0 ], table );
    assert.deepEqual( spyCall.args[ 1 ], params );
  } );

  test( "should not log a storage file not found error when done is fired if the error has resolved itself on a refresh", function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-no-file", {
      "detail": "Widgets/simpson's.jpg",
      "bubbles": true
    } ) );

    // Resolve the error.
    RiseVision.Image.onFileRefresh( window.gadget.settings.additionalParams.selector.url );

    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );
    params.event = "done";
    params.file_url = window.gadget.settings.additionalParams.selector.url;
    delete params.event_details;

    clock.tick( 5000 );

    assert( spy.notCalled );
  } );

} );

suite( "storage file throttled", function() {
  var spyCall;

  test( "should log a storage file throttled error", function() {
    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-file-throttled", {
      "detail": window.gadget.settings.additionalParams.selector.url,
      "bubbles": true
    } ) );

    params.event = "error";
    params.event_details = "storage file throttled";
    params.file_url = window.gadget.settings.additionalParams.selector.url;

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

  test( "should log a storage file throttled error when done is fired", function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-file-throttled", {
      "detail": window.gadget.settings.additionalParams.selector.url,
      "bubbles": true
    } ) );

    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );
    clock.tick( 5000 );
    assert( spy.calledOnce );

    spyCall = RiseVision.Common.LoggerUtils.logEvent.getCall( 0 );

    assert.equal( spyCall.args[ 0 ], table );
    assert.deepEqual( spyCall.args[ 1 ], params );
  } );

  test( "should not log a storage file throttled error when done is fired if the error has resolved itself on a refresh", function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-file-throttled", {
      "detail": window.gadget.settings.additionalParams.selector.url,
      "bubbles": true
    } ) );

    // Resolve the error.
    RiseVision.Image.onFileRefresh( window.gadget.settings.additionalParams.selector.url );

    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );
    params.event = "done";
    params.file_url = window.gadget.settings.additionalParams.selector.url;
    delete params.event_details;

    clock.tick( 5000 );

    assert( spy.notCalled );
  } );
} );

suite( "storage subscription expired", function() {
  var spyCall;

  test( "should log a storage subscription expired error", function() {
    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-subscription-expired" ) );

    params.event = "error";
    params.event_details = "storage subscription expired";
    delete params.file_url;
    delete params.file_format;

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

  test( "should log a storage subscription error", function() {
    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-subscription-error", {
      "detail": {
        "error": {
          "currentTarget": {
            "status": 0
          }
        }
      },
      "bubbles": true
    } ) );

    params.event_details = "storage subscription error";
    params.error_details = "The request failed with status code: 0";

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

  test( "should log a storage subscription expired error when done is fired", function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-subscription-expired" ) );

    params.event_details = "storage subscription expired";
    delete params.error_details;

    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );
    clock.tick( 5000 );
    assert( spy.calledOnce );

    spyCall = RiseVision.Common.LoggerUtils.logEvent.getCall( 0 );

    assert.equal( spyCall.args[ 0 ], table );
    assert.deepEqual( spyCall.args[ 1 ], params );
  } );

  test( "should not log a storage subscription expired error when done is fired if the error has resolved itself on a refresh", function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-subscription-expired" ) );

    // Resolve the error.
    RiseVision.Image.onFileRefresh( window.gadget.settings.additionalParams.selector.url );

    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );
    params.event = "done";
    params.file_url = window.gadget.settings.additionalParams.selector.url;
    params.file_format = "jpg";
    delete params.event_details;

    clock.tick( 5000 );

    assert( spy.notCalled );
  } );
} );
