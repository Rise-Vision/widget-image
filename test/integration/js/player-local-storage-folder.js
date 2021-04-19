/* global suiteSetup, suite, test, assert, suiteTeardown,
 RiseVision, sinon */

/* eslint-disable func-names */

var messageHandlers;

suite( "files initialized", function() {
  var onFileInitSpy;

  suiteSetup( function() {
    onFileInitSpy = sinon.stub( RiseVision.ImageWatch, "onFileInit" );

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

    // mock receiving file-update to notify files are downloading
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-c.jpg",
        status: "STALE"
      } );

      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg",
        status: "STALE"
      } );
    } );


    // mock receiving file-update to notify files are available
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-c.jpg",
        status: "CURRENT",
        ospath: "path/to/file/def456",
        osurl: "file:///path/to/file/def456"
      } );

      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg",
        status: "CURRENT",
        ospath: "path/to/file/abc123",
        osurl: "file:///path/to/file/abc123"
      } );
    } );

  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileInit.restore();
  } );

  test( "should be able to configure slider with correct urls", function() {
    assert( onFileInitSpy.calledOnce, "onFileInit() called once" );
    assert.equal( onFileInitSpy.args[ 0 ][ 0 ].length, 2, "intialized with 2 files" );
    assert.equal( onFileInitSpy.args[ 0 ][ 0 ][ 0 ].filePath, "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg", "file are sorted alphabetically ascending" );
    assert.equal( onFileInitSpy.args[ 0 ][ 0 ][ 0 ].url, "file:///path/to/file/abc123", "file 1 url is correct" );
    assert.equal( onFileInitSpy.args[ 0 ][ 0 ][ 1 ].url, "file:///path/to/file/def456", "file 2 url is correct" );
  } );
} );

suite( "file added", function() {
  var onFileRefreshStub;

  suiteSetup( function() {

    onFileRefreshStub = sinon.stub( RiseVision.ImageWatch, "onFileRefresh" );

    // mock receiving file-update to notify a new file is available in this watched folder
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg",
        status: "STALE"
      } );
    } );

    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg",
        status: "CURRENT",
        ospath: "path/to/file/ghi789",
        osurl: "file:///path/to/file/ghi789"
      } );
    } );

  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileRefresh.restore();
  } );

  test( "should be able to configure slider with an additional image", function() {
    assert( onFileRefreshStub.calledOnce, "onFileRefresh() called once" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ].length, 3, "refreshed with 3 files" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ][ 1 ].filePath, "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg", "file are sorted alphabetically ascending" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ][ 1 ].url, "file:///path/to/file/ghi789", "file 3 url is correct" );
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

  test( "should be able to configure slider with an updated image", function() {
    assert( onFileRefreshStub.calledOnce, "onFileRefresh() called once" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ].length, 3, "refreshed with 3 files" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ][ 0 ].filePath, "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg", "files remain sorted alphabetically ascending" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ][ 0 ].url, "file:///path/to/file/cba321", "updated file url is correct" );
  } );
} );

suite( "file deleted", function() {
  var onFileRefreshStub;

  suiteSetup( function() {

    onFileRefreshStub = sinon.stub( RiseVision.ImageWatch, "onFileRefresh" );

    // mock receiving file-update to notify a new file is available in this watched folder
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg",
        status: "DELETED"
      } );
    } );

  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileRefresh.restore();
  } );

  test( "should be able to configure slider after an image was deleted", function() {
    assert( onFileRefreshStub.calledOnce, "onFileRefresh() called once" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ].length, 2, "refreshed with 2 files" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ][ 1 ].filePath, "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-c.jpg", "files remain sorted alphabetically ascending" );
  } );
} );

suite( "file error from update", function() {
  var onFileRefreshStub;

  suiteSetup( function() {

    onFileRefreshStub = sinon.stub( RiseVision.ImageWatch, "onFileRefresh" );

    // mock adding this file
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg",
        status: "STALE"
      } );
    } );

    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg",
        status: "CURRENT",
        ospath: "path/to/file/ghi789",
        osurl: "file:///path/to/file/ghi789"
      } );
    } );

  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileRefresh.restore();
  } );

  test( "should be able to configure slider after file error received for one of the images in list", function() {
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ].length, 3, "refreshed with 3 files" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ][ 1 ].url, "file:///path/to/file/ghi789", "file 3 url is correct" );

    // mock FILE-ERROR for this image
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-ERROR",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg",
        msg: "Insufficient disk space"
      } );
    } );

    // file should be removed from list provided to onFileRefresh()
    assert( onFileRefreshStub.calledTwice, "onFileRefresh() called twice" );
    assert.equal( onFileRefreshStub.args[ 1 ][ 0 ].length, 2, "refreshed with 2 files" );
    assert.equal( onFileRefreshStub.args[ 1 ][ 0 ][ 1 ].url, "file:///path/to/file/def456", "file 2 url is correct" );
  } );
} );
