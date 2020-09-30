/* global suiteSetup, suite, suiteTeardown, teardown, test, assert, RiseVision, sinon */

/* eslint-disable func-names */

var table = "image_events",
  filePath = window.gadget.settings.additionalParams.storage.folder,
  params = {
    "event": "error",
    "event_details": "storage folder empty",
    "configuration": "storage folder",
    "company_id": "\"companyId\"",
    "display_id": "\"displayId\"",
    "version": "0.1.1"
  },
  ready = false,
  isV2Running = false,
  storage,
  spy,
  clock,
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
  check( done );
} );

teardown( function() {
  RiseVision.Common.Logger.log.restore();
} );

suite( "configuration", function() {
  var sliderReadySpy = sinon.spy( RiseVision.Image, "onSliderReady" ),
    check = function( done ) {
      if ( sliderReadySpy && sliderReadySpy.calledOnce ) {
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

  suiteTeardown( function() {
    RiseVision.Image.onSliderReady.restore();
  } );

  test( "should log the configuration event", function() {

    assert( spy.calledWith( table, {
      "event": "configuration",
      "event_details": params.configuration,
      "file_url": "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/",
      "file_format": "JPG|JPEG|PNG|BMP|SVG|GIF|WEBP",
      "configuration": params.configuration,
      "company_id": params.company_id,
      "display_id": params.display_id,
      "version": params.version
    } ) );

  } );
} );

suite( "storage folder empty", function() {

  suiteSetup( function() {
    clock = sinon.useFakeTimers();
  } );

  suiteTeardown( function() {
    clock.restore();
  } );

  test( "should log a storage folder empty error", function() {
    spy = sinon.spy( RiseVision.Common.Logger, "log" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-empty-folder", {
      "detail": null,
      "bubbles": true
    } ) );

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

} );

suite( "storage folder doesn't exist", function() {
  suiteSetup( function() {
    clock = sinon.useFakeTimers();
  } );

  suiteTeardown( function() {
    clock.restore();
  } );

  test( "should log a storage folder doesn't exist error", function() {
    spy = sinon.spy( RiseVision.Common.Logger, "log" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-no-folder", {
      "detail": filePath,
      "bubbles": true
    } ) );

    params.event = "error";
    params.event_details = "storage folder doesn't exist";
    params.error_details = filePath;
    delete params.file_url;

    assert( spy.calledOnce );
  } );

} );

suite( "storage folder invalid format", function() {
  suiteSetup( function() {
    clock = sinon.useFakeTimers();
  } );

  suiteTeardown( function() {
    clock.restore();
  } );

  test( "should log a storage folder format(s) invalid error", function() {
    spy = sinon.spy( RiseVision.Common.Logger, "log" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-folder-invalid", {
      "detail": filePath,
      "bubbles": true
    } ) );

    params.event = "error";
    params.event_details = "storage folder format(s) invalid";
    delete params.file_url;
    delete params.error_details;

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

} );

suite( "rise storage error", function() {
  suiteSetup( function() {
    clock = sinon.useFakeTimers();
  } );

  suiteTeardown( function() {
    clock.restore();
  } );

  test( "should log a rise storage error", function() {
    spy = sinon.spy( RiseVision.Common.Logger, "log" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-error", {
      "detail": {
        "error": {
          "currentTarget": {
            "status": 0
          }
        } },
      "bubbles": true
    } ) );

    params.event = "rise storage error";
    params.event_details = "The request failed with status code: 0 | error object: " + JSON.stringify( { "currentTarget": { "status": 0 } } );
    delete params.file_url;

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

  test( "should log a rise cache error", function() {
    spy = sinon.spy( RiseVision.Common.Logger, "log" );

    storage.dispatchEvent( new CustomEvent( "rise-cache-error", {
      "detail": {
        "error": {
          "message": "The request failed with status code: 500"
        } },
      "bubbles": true
    } ) );

    params.event = "rise cache error";
    params.event_details = "The request failed with status code: 500";
    delete params.file_url;

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

  test( "should log a rise cache not running when ping response is empty", function() {
    spy = sinon.spy( RiseVision.Common.Logger, "log" );

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

    params.event = "error"
    params.event_details = "rise cache not running";
    params.error_details = "";

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

  test( "should log a rise cache not running when ping response is 404", function() {
    spy = sinon.spy( RiseVision.Common.Logger, "log" );

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

    params.event = "error"
    params.event_details = "rise cache not running";
    params.error_details = "The request failed with status code: 404";

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );
} );

suite( "storage subscription expired", function() {
  suiteSetup( function() {
    clock = sinon.useFakeTimers();
  } );

  suiteTeardown( function() {
    clock.restore();
  } );

  test( "should log a storage subscription expired error", function() {
    spy = sinon.spy( RiseVision.Common.Logger, "log" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-subscription-expired" ) );

    params.event = "error";
    params.event_details = "storage subscription expired";
    delete params.error_details;
    delete params.file_url;
    delete params.file_format;

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

  test( "should log a storage subscription error", function() {
    spy = sinon.spy( RiseVision.Common.Logger, "log" );

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

suite( "storage api error", function() {
  suiteSetup( function() {
    clock = sinon.useFakeTimers();
  } );

  suiteTeardown( function() {
    clock.restore();
  } );

  test( "should log a storage api error", function() {
    spy = sinon.spy( RiseVision.Common.Logger, "log" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-api-error", {
      "detail": {
        "result": false,
        "code": 500,
        "message": "Could not retrieve Bucket Items"
      },
      "bubbles": true
    } ) );

    params.event = "error";
    params.event_details = "storage api error";
    params.error_details = "Response code: 500, message: Could not retrieve Bucket Items";
    delete params.file_url;

    assert( spy.calledOnce );
    assert( spy.calledWith( table, params ) );
  } );

} );
