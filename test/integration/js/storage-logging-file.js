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
    "version": "0.1.1"
  },
  ready = false,
  isV2Running = false,
  requests,
  storage,
  spy,
  check = function( done ) {
    if ( ready ) {
      sinon.stub( RiseVision.Image, "play" );

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
      "file_url": "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
      "file_format": "jpg",
      "company_id": params.company_id,
      "display_id": params.display_id,
      "version": params.version
    } ) );

  } );
} );

suite( "rise storage error", function() {

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

} );

suite( "storage file not found", function() {

  test( "should log a storage file not found error", function() {
    spy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-no-file", {
      "detail": "Widgets/simpson's.jpg",
      "bubbles": true
    } ) );

    params.event = "error";
    params.event_details = "storage file not found";
    params.file_url = "Widgets/simpson's.jpg";
    params.file_format = "jpg";
    delete params.error_details;

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

} );

suite( "storage file throttled", function() {

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

} );

suite( "storage subscription expired", function() {

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

} );
