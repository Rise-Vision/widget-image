/* global suiteSetup, suite, setup, teardown, test, assert, suiteTeardown,
 RiseVision, sinon */

/* eslint-disable func-names */

var messageHandlers;

suite( "file added", function() {
  var onFileInitSpy;

  suiteSetup( function() {
    onFileInitSpy = sinon.spy( RiseVision.ImageWatch, "onFileInit" );

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

    // mock receiving file-update to notify file is downloading
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        status: "STALE"
      } );
    } );

    // mock receiving file-update to notify file is available
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        status: "CURRENT",
        ospath: "path/to/file/abc123",
        osurl: "file:///path/to/file/abc123"
      } );
    } );
  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileInit.restore();
  } );

  test( "should be able to set single image with correct url", function() {
    assert( onFileInitSpy.calledOnce, "onFileInit() called once" );
    assert( onFileInitSpy.calledWith( "file:///path/to/file/abc123" ), "onFileInit() called with correct url" );
  } );

  test( "should align image at top left", function() {
    assert.isNotNull( document.querySelector( ".top-left" ) );
  } );

  test( "should scale image to fit", function() {
    assert.isNotNull( document.querySelector( ".scale-to-fit" ) );
  } );
} );

suite( "file changed", function() {
  var refreshSpy;

  setup( function() {
    refreshSpy = sinon.spy( RiseVision.ImageWatch, "onFileRefresh" );
  } );

  teardown( function() {
    RiseVision.ImageWatch.onFileRefresh.restore();
  } );

  test( "should call onFileRefresh() and set background image", function() {
    // mock receiving file-update to notify file is downloading
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        status: "STALE"
      } );
    } );

    // mock receiving file-update to notify file is available
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        status: "CURRENT",
        ospath: "path/to/file/def456",
        osurl: "file:///path/to/file/def456"
      } );
    } );

    assert( refreshSpy.calledOnce );
    assert( refreshSpy.calledWith( "file:///path/to/file/def456" ), "onFileRefresh() called with correct url" );
  } );
} );

suite( "file deleted", function() {
  var onFileDeletedStub;

  suiteSetup( function() {
    onFileDeletedStub = sinon.stub( RiseVision.ImageWatch, "onFileDeleted" );

    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "file-update",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        status: "deleted"
      } );
    } );

  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileDeleted.restore();
  } );

  test( "should display error and clear image", function() {
    assert.equal( onFileDeletedStub.calledOnce, true );
  } );
} );
