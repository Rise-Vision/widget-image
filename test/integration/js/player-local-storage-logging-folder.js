/* global suiteSetup, suite, setup, teardown, test, assert,
 RiseVision, sinon */

/* eslint-disable func-names */

var table = "image_events",
  params = {
    "event": "error",
    "event_details": "",
    "file_url": "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/",
    "file_format": "unknown",
    "configuration": "storage folder (rls)",
    "company_id": "\"companyId\"",
    "display_id": "\"displayId\"",
    "version": "0.1.1"
  },
  ready = false,
  messageHandlers,
  logSpy,
  check = function( done ) {
    if ( ready ) {
      sinon.stub( RiseVision.ImageRLS, "play" );
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

setup( function() {
  sinon.stub( RiseVision.ImageRLS, "onFileInit" );
  sinon.stub( RiseVision.ImageRLS, "onFileRefresh" );
} );

teardown( function() {
  logSpy.restore();
  RiseVision.ImageRLS.onFileInit.restore();
  RiseVision.ImageRLS.onFileRefresh.restore();
} );

suite( "configuration", function() {

  test( "should log the configuration event", function() {

    assert( logSpy.calledWith( table, {
      "event": "configuration",
      "event_details": params.configuration,
      "file_url": params.file_url,
      "file_format": "JPG|JPEG|PNG|BMP|SVG|GIF|WEBP",
      "configuration": params.configuration,
      "company_id": params.company_id,
      "display_id": params.display_id,
      "version": params.version
    } ) );

  } );
} );

suite( "errors", function() {
  var clock;

  setup( function() {
    clock = sinon.useFakeTimers();
  } );

  teardown( function() {
    clock.restore();
  } );

  test( "required modules unavailable", function() {
    var i;

    function receiveClientList() {
      // mock receiving client-list message
      messageHandlers.forEach( function( handler ) {
        handler( {
          topic: "client-list",
          clients: [ "local-messaging" ]
        } );
      } );
    }

    logSpy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    // mock 30 more client-list messages sent/received
    for ( i = 30; i >= 0; i-- ) {
      receiveClientList();
      clock.tick( 1000 );
    }

    params.event_details = "required modules unavailable";

    assert( logSpy.calledOnce );
    assert( logSpy.calledWith( table, params ) );
  } );

  test( "unauthorized", function() {
    logSpy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    // mock receiving client-list message
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "client-list",
        clients: [ "local-storage", "licensing" ]
      } );
    } );

    // mock receiving storage-licensing message
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "storage-licensing-update",
        isAuthorized: false,
        userFriendlyStatus: "unauthorized"
      } );
    } );

    params.event = "warning";
    params.event_details = "unauthorized";

    assert( logSpy.calledOnce );
    assert( logSpy.calledWith( table, params ) );

  } );

  test( "folder does not exist", function() {
    logSpy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    // mock receiving client-list message
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "client-list",
        clients: [ "local-storage", "licensing" ]
      } );
    } );

    // mock receiving storage-licensing message
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "storage-licensing-update",
        isAuthorized: true,
        userFriendlyStatus: "authorized"
      } );
    } );

    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "file-update",
        filePath: params.file_url,
        status: "NOEXIST"
      } );
    } );

    params.event = "error";
    params.event_details = "folder does not exist";

    assert( logSpy.calledOnce );
    assert( logSpy.calledWith( table, params ) );

  } );

  test( "file error", function() {
    var logParams;

    logSpy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "file-error",
        filePath: params.file_url + "test-file-in-error.jpg",
        msg: "Could not retrieve signed URL",
        detail: "error details"
      } );
    } );

    logParams = JSON.parse( JSON.stringify( params ) );
    logParams.file_url = params.file_url + "test-file-in-error.jpg";
    logParams.file_format = "jpg";
    logParams.event_details = "Could not retrieve signed URL";
    logParams.error_details = "error details";

    assert( logSpy.calledOnce );
    assert( logSpy.calledWith( table, logParams ) );

    // file is getting processed, starts the initial processing timer
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: params.file_url + "test-file-in-error-2.jpg",
        status: "STALE"
      } );
    } );

    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "file-error",
        filePath: params.file_url + "test-file-in-error-2.jpg",
        msg: "Could not retrieve signed URL",
        detail: "error details"
      } );
    } );

    logParams.file_url = params.file_url + "test-file-in-error-2.jpg";

    assert( logSpy.calledTwice );
    assert( logSpy.calledWith( table, logParams ) );

    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "file-error",
        filePath: params.file_url + "test-file-in-error.jpg",
        msg: "Could not retrieve signed URL",
        detail: "error details"
      } );
    } );

    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "file-error",
        filePath: params.file_url + "test-file-in-error-2.jpg",
        msg: "Could not retrieve signed URL",
        detail: "error details"
      } );
    } );

    // should still have only logged once per file in error
    assert.equal( logSpy.callCount, 2 );

    // initial processing timer expires
    clock.tick( 15000 );

    // should log a warning about no files to display
    logParams.event = "warning";
    logParams.event_details = "No files to display (startup)";
    logParams.file_url = params.file_url;
    logParams.file_format = "unknown";
    delete logParams.error_details;

    assert.equal( logSpy.callCount, 3 );
    assert( logSpy.calledWith( table, logParams ) );

    // force file corrected
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: params.file_url + "test-file-in-error-2.jpg",
        status: "STALE"
      } );
    } );

    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: params.file_url + "test-file-in-error-2.jpg",
        status: "CURRENT",
        ospath: "path/to/file/abc123",
        osurl: "file:///path/to/file/abc123"
      } );
    } );

    // force initialLoad to complete and be set to false
    clock.tick( 15000 );

    // file has an error again on a later update, should be able to log error again since it was previously removed from filesInError list
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "file-error",
        filePath: params.file_url + "test-file-in-error-2.jpg",
        msg: "Could not retrieve signed URL",
        detail: "error details"
      } );
    } );

    logParams.event = params.event;
    logParams.file_url = params.file_url + "test-file-in-error-2.jpg";
    logParams.file_format = "jpg";
    logParams.event_details = "Could not retrieve signed URL";
    logParams.error_details = "error details";

    assert.equal( logSpy.callCount, 5 );
    assert( logSpy.calledWith( table, logParams ) );

  } );

} );

suite( "folder file deleted", function() {
  test( "should log when a file in folder is deleted", function() {
    var logParams = JSON.parse( JSON.stringify( params ) );

    logSpy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    // file is added
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: params.file_url + "test-file-delete.jpg",
        status: "STALE"
      } );
    } );

    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: params.file_url + "test-file-delete.jpg",
        status: "CURRENT",
        ospath: "path/to/file/abc123",
        osurl: "file:///path/to/file/abc123"
      } );
    } );

    assert.equal( logSpy.callCount, 0 );

    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: params.file_url + "test-file-delete.jpg",
        status: "DELETED"
      } );
    } );

    logParams.event = "file deleted";
    logParams.file_url = params.file_url + "test-file-delete.jpg";
    logParams.file_format = "jpg";
    logParams.local_url = "file:///path/to/file/abc123";
    delete logParams.event_details;

    assert( logSpy.calledTwice );
    assert( logSpy.calledWith( table, logParams ) );
    // no files left to display, should log a warning
    assert( logSpy.calledWith( table, {
      event: "warning",
      event_details: "No files to display",
      file_url: params.file_url,
      file_format: "unknown",
      configuration: params.configuration,
      company_id: params.company_id,
      display_id: params.display_id,
      version: params.version
    } ) );

  } );
} );

suite( "folder is empty", function() {

  test( "should log a warning when a folder is empty", function() {
    var logParams = JSON.parse( JSON.stringify( params ) );

    logSpy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );

    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "file-update",
        filePath: params.file_url,
        status: "EMPTYFOLDER"
      } );
    } );

    logParams.event = "warning";
    logParams.event_details = "folder empty";
    logParams.file_url = params.file_url;
    logParams.file_format = "unknown";

    assert( logSpy.calledOnce );
    assert( logSpy.calledWith( table, logParams ) );

  } );

} );
