/* global suite, test, assert, suiteSetup, suiteTeardown, RiseVision, sinon */

/* eslint-disable func-names */

var receivedCounter = 0,
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

window.addEventListener( "message", function( event ) {
  receivedHandler( event );
} );

suite( "files initialized", function() {
  var onFileInitSpy;

  suiteSetup( function( done ) {
    onFileInitSpy = sinon.stub( RiseVision.ImageWatch, "onFileInit" );

    receivedExpected = 4;

    callback = done;

    // mock receiving file-update to notify file is downloading
    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-c.jpg",
      status: "STALE"
    }, "*" );

    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg",
      status: "STALE"
    }, "*" );

    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-c.jpg",
      status: "CURRENT"
    }, "*" );

    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg",
      status: "CURRENT"
    }, "*" );
  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileInit.restore();
    receivedCounter = 0;
    receivedExpected = 0;
    callback = null;
  } );

  test( "should be able to configure slider with correct urls", function() {
    assert( onFileInitSpy.calledOnce, "onFileInit() called once" );
    assert.equal( onFileInitSpy.args[ 0 ][ 0 ].length, 2, "intialized with 2 files" );
    assert.equal( onFileInitSpy.args[ 0 ][ 0 ][ 0 ].filePath, "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg", "file are sorted alphabetically ascending" );
    assert.equal( onFileInitSpy.args[ 0 ][ 0 ][ 0 ].url, "https://widgets.risevision.com/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg", "file 1 url is correct" );
    assert.equal( onFileInitSpy.args[ 0 ][ 0 ][ 1 ].url, "https://widgets.risevision.com/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-c.jpg", "file 2 url is correct" );
  } );
} );

suite( "file added", function() {
  var onFileRefreshStub;

  suiteSetup( function( done ) {

    onFileRefreshStub = sinon.stub( RiseVision.ImageWatch, "onFileRefresh" );

    receivedExpected = 2;

    callback = done;

    // mock receiving file-update to notify a new file is available in this watched folder
    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg",
      status: "STALE"
    }, "*" );

    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg",
      status: "CURRENT"
    }, "*" );
  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileRefresh.restore();
    receivedCounter = 0;
    receivedExpected = 0;
    callback = null;
  } );

  test( "should be able to configure slider with an additional image", function() {
    assert( onFileRefreshStub.calledOnce, "onFileRefresh() called once" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ].length, 3, "refreshed with 3 files" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ][ 1 ].filePath, "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg", "file are sorted alphabetically ascending" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ][ 1 ].url, "https://widgets.risevision.com/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg", "file 3 url is correct" );
  } );
} );

suite( "file updated", function() {
  var onFileRefreshStub;

  suiteSetup( function( done ) {

    onFileRefreshStub = sinon.stub( RiseVision.ImageWatch, "onFileRefresh" );

    receivedExpected = 2;
    callback = done;

    // mock receiving file-update to notify a new file is available in this watched folder
    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg",
      status: "STALE"
    }, "*" );

    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg",
      status: "CURRENT"
    }, "*" );
  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileRefresh.restore();
    receivedCounter = 0;
    receivedExpected = 0;
    callback = null;
  } );

  test( "should be able to configure slider with an updated image", function() {
    assert( onFileRefreshStub.calledOnce, "onFileRefresh() called once" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ].length, 3, "refreshed with 3 files" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ][ 0 ].filePath, "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg", "files remain sorted alphabetically ascending" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ][ 0 ].url, "https://widgets.risevision.com/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-a.jpg", "updated file url is correct" );
  } );
} );

suite( "file deleted", function() {
  var onFileRefreshStub;

  suiteSetup( function( done ) {

    onFileRefreshStub = sinon.stub( RiseVision.ImageWatch, "onFileRefresh" );

    receivedExpected = 1;
    callback = done;

    // mock receiving file-update to notify a new file is available in this watched folder
    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg",
      status: "DELETED"
    }, "*" );
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

  suiteSetup( function( done ) {

    onFileRefreshStub = sinon.stub( RiseVision.ImageWatch, "onFileRefresh" );

    receivedExpected = 2;
    callback = done;

    // mock adding this file
    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg",
      status: "STALE"
    }, "*" );

    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg",
      status: "CURRENT"
    }, "*" );
  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileRefresh.restore();
  } );

  test( "should be able to configure slider after file error received for one of the images in list", function( done ) {
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ].length, 3, "refreshed with 3 files" );
    assert.equal( onFileRefreshStub.args[ 0 ][ 0 ][ 1 ].url, "https://widgets.risevision.com/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg", "file 2 url is correct" );

    receivedCounter = 0;
    receivedExpected = 1;
    callback = function() {
      // file should be removed from list provided to onFileRefresh()
      setTimeout( function() {
        assert( onFileRefreshStub.calledTwice, "onFileRefresh() called twice" );
        assert.equal( onFileRefreshStub.args[ 1 ][ 0 ].length, 2, "refreshed with 2 files" );
        assert.equal( onFileRefreshStub.args[ 1 ][ 0 ][ 1 ].url, "https://widgets.risevision.com/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-c.jpg", "file 2 url is correct" );
        done();
      }, 200 );
    };

    // mock FILE-ERROR for this image
    window.postMessage( {
      topic: "FILE-ERROR",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/test-file-b.jpg",
      msg: "Insufficient disk space"
    }, "*" );
  } );
} );
