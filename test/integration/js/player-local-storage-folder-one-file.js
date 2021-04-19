/* global suiteSetup, suite, test, assert, setup, teardown, suiteTeardown,
 RiseVision, sinon */

/* eslint-disable func-names */

var messageHandlers;

suite( "initialized with 1 file", function() {
  var onFileInitSpy,
    clock;

  suiteSetup( function() {
    onFileInitSpy = sinon.stub( RiseVision.ImageWatch, "onFileInit" );

    // mock receiving client-list message
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "client-list",
        clients: [ "local-storage", "licensing" ]
      } );
    } );

  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileInit.restore();
  } );

  setup( function() {
    clock = sinon.useFakeTimers();
  } );

  teardown( function() {
    clock.restore();
  } );

  test( "should be able to configure slider with 1 file in folder", function() {
    // mock receiving storage-licensing message
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "storage-licensing-update",
        isAuthorized: true,
        userFriendlyStatus: "authorized"
      } );
    } );

    // mock receiving file-update to notify files are downloading
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg",
        status: "STALE"
      } );
    } );

    clock.tick( 7000 );

    assert( !onFileInitSpy.called, "onFileInit() is not called, processing timer running" );

    // mock receiving file-update to notify files are available
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg",
        status: "CURRENT",
        ospath: "path/to/file/abc123",
        osurl: "file:///path/to/file/abc123"
      } );
    } );

    clock.tick( 7000 );

    assert( !onFileInitSpy.called, "onFileInit() is not called, processing timer still running to try and get at least 2 files" );

    // 15 seconds is up
    clock.tick( 1000 );

    assert( onFileInitSpy.calledOnce, "onFileInit() called once" );
    assert.equal( onFileInitSpy.args[ 0 ][ 0 ].length, 1, "intialized with 1 file" );
    assert.equal( onFileInitSpy.args[ 0 ][ 0 ][ 0 ].url, "file:///path/to/file/abc123", "url is correct" );
  } );
} );

suite( "file updated", function() {
  var onFileRefreshStub;

  suiteSetup( function() {

    onFileRefreshStub = sinon.stub( RiseVision.ImageWatch, "onFileRefresh" );

    // mock receiving file-update to notify a new file is available in this watched folder
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg",
        status: "STALE"
      } );
    } );

    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg",
        status: "CURRENT",
        ospath: "path/to/file/cba321",
        osurl: "file:///path/to/file/cba321"
      } );
    } );

  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileRefresh.restore();
  } );

  test( "should be able to configure slider with an updated version of the one file in folder", function() {
    assert( onFileRefreshStub.calledOnce, "onFileRefresh() called once" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ].length, 1, "refreshed with 1 file" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ][ 0 ].url, "file:///path/to/file/cba321", "updated file url is correct" );
  } );
} );
