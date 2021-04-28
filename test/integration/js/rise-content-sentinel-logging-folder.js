/* global suiteSetup, suite, test, assert, logSpy,
 RiseVision, sinon */

/* eslint-disable func-names */

var table = "image_events",
  params = {
    "event": "error",
    "event_details": "",
    "file_url": "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/",
    "file_format": "unknown",
    "configuration": "storage folder (sentinel)",
    "company_id": "\"companyId\"",
    "display_id": "\"displayId\"",
    "version": "0.1.1"
  },
  receivedCounter = 0,
  receivedExpected = 0,
  callback = null,
  receivedHandler = function( event ) {
    if ( event.data.topic.indexOf( "FILE-" ) !== -1 ) {
      receivedCounter += 1;

      if ( receivedCounter === receivedExpected ) {
        callback && callback();
      }
    }
  };

window.addEventListener( "message", function( evt ) {
  receivedHandler( evt );
} );

suite( "errors", function() {

  suiteSetup( function( done ) {
    sinon.stub( RiseVision.ImageWatch, "play" );

    receivedExpected = 1;
    callback = done;

    window.postMessage( {
      topic: "FILE-ERROR",
      filePath: params.file_url + "test-file-in-error.jpg",
      msg: "Could not retrieve signed URL",
      detail: "error details"
    }, "*" );
  } )

  test( "file error", function() {
    var logParams;

    logParams = JSON.parse( JSON.stringify( params ) );
    logParams.file_url = params.file_url + "test-file-in-error.jpg";
    logParams.file_format = "jpg";
    logParams.event = "error";
    logParams.event_details = "Could not retrieve signed URL";
    logParams.error_details = "error details";

    // once for configuration event and once for error
    assert( logSpy.calledTwice );
    assert( logSpy.calledWith( table, logParams, {
      severity: "error",
      errorCode: "E000000215",
      eventApp: "widget-image",
      debugInfo: JSON.stringify( {
        "watchType": "rise-content-sentinel",
        "file_url": params.file_url + "test-file-in-error.jpg"
      } )
    } ) );
  } );

} );
