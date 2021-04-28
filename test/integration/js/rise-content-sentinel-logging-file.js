/* global suiteSetup, suite, test, assert, logSpy,
 RiseVision, sinon */

/* eslint-disable func-names */

var table = "image_events",
  params = {
    "event": "error",
    "event_details": "",
    "file_url": "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
    "file_format": "jpg",
    "configuration": "storage file (sentinel)",
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

    receivedExpected = 2;
    callback = done;

    window.postMessage( {
      topic: "FILE-ERROR",
      filePath: params.file_url,
      msg: "File's host server could not be reached",
      detail: "error details"
    }, "*" );

    window.postMessage( {
      topic: "FILE-ERROR",
      filePath: params.file_url,
      msg: "File's host server could not be reached",
      detail: "error details"
    }, "*" );
  } )

  test( "file error", function() {
    params.event = "error";
    params.event_details = "File's host server could not be reached";
    params.error_details = "error details";

    // configuration event and one error event
    assert.equal( logSpy.callCount, 2 );
    assert( logSpy.calledWith( table, params, {
      severity: "error",
      errorCode: "E000000215",
      eventApp: "widget-image",
      debugInfo: JSON.stringify( {
        "watchType": "rise-content-sentinel",
        file_url: params.file_url
      } )
    } ) );
  } );

} );
