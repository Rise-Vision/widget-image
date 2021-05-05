/* global suiteSetup, suite, setup, teardown, test, assert, suiteTeardown,
 RiseVision, sinon */

/* eslint-disable func-names */

var messageHandlers;

suite( "file added", function() {
  var onFileInitSpy,
    handleImageSpy,
    convertStub;

  suiteSetup( function() {
    onFileInitSpy = sinon.spy( RiseVision.ImageWatch, "onFileInit" );
    handleImageSpy = sinon.spy( RiseVision.ImageUtils, "handleSingleImageLoad" );
    convertStub = sinon.stub( RiseVision.ImageUtils, "convertSVGToDataURL", function( filePath, localUrl, callback ) {
      callback( "data:image/svg+xml;base64,ABC123def456" );
    } );

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
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file.svg",
        status: "STALE"
      } );
    } );

    // mock receiving file-update to notify file is available
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file.svg",
        status: "CURRENT",
        ospath: "path/to/file/abc123",
        osurl: "file:///path/to/file/abc123"
      } );
    } );
  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileInit.restore();
    RiseVision.ImageUtils.handleSingleImageLoad.restore();
    RiseVision.ImageUtils.convertSVGToDataURL.restore();
  } );

  test( "should set single image with a data url", function() {
    assert( onFileInitSpy.calledOnce, "onFileInit() called once" );
    assert( onFileInitSpy.calledWith( "file:///path/to/file/abc123" ), "onFileInit() called with correct url" );
    assert.equal( convertStub.args[ 0 ][ 0 ], "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file.svg" );
    assert.equal( convertStub.args[ 0 ][ 1 ], "file:///path/to/file/abc123" );
    assert.equal( handleImageSpy.args[ 0 ][ 0 ], "data:image/svg+xml;base64,ABC123def456" );

  } );

  test( "should align image at top left", function() {
    assert.isNotNull( document.querySelector( ".top-left" ) );
  } );

  test( "should scale image to fit", function() {
    assert.isNotNull( document.querySelector( ".scale-to-fit" ) );
  } );
} );

suite( "file changed", function() {
  var refreshSpy,
    handleImageSpy,
    convertStub;

  setup( function() {
    refreshSpy = sinon.spy( RiseVision.ImageWatch, "onFileRefresh" );
    handleImageSpy = sinon.spy( RiseVision.ImageUtils, "handleSingleImageLoad" );
    convertStub = sinon.stub( RiseVision.ImageUtils, "convertSVGToDataURL", function( filePath, localUrl, callback ) {
      callback( "data:image/svg+xml;base64,ABC123def456" );
    } );
  } );

  teardown( function() {
    RiseVision.ImageWatch.onFileRefresh.restore();
    RiseVision.ImageUtils.handleSingleImageLoad.restore();
    RiseVision.ImageUtils.convertSVGToDataURL.restore();
  } );

  test( "should refresh single image with a data url", function() {
    // mock receiving file-update to notify file is downloading
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file.svg",
        status: "STALE"
      } );
    } );

    // mock receiving file-update to notify file is available
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file.svg",
        status: "CURRENT",
        ospath: "path/to/file/def456",
        osurl: "file:///path/to/file/def456"
      } );
    } );

    assert( refreshSpy.calledOnce );
    assert( refreshSpy.calledWith( "file:///path/to/file/def456" ), "onFileRefresh() called with correct url" );
    assert.equal( convertStub.args[ 0 ][ 0 ], "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file.svg" );
    assert.equal( convertStub.args[ 0 ][ 1 ], "file:///path/to/file/def456" );
    assert.equal( handleImageSpy.args[ 0 ][ 0 ], "data:image/svg+xml;base64,ABC123def456" );
  } );
} );
