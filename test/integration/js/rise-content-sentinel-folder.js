/* global suite, test, assert, suiteSetup, suiteTeardown, RiseVision, sinon */

/* eslint-disable func-names */

var receivedCounter = 0,
  receivedExpected = 0,
  callback = null,
  receivedHandler = function() {
    if ( event.data.topic.indexOf( "FILE-" ) !== -1 ) {
      receivedCounter += 1;

      if ( receivedCounter === receivedExpected ) {
        callback && callback();
      }
    }
  };

window.addEventListener( "message", function() {
  receivedHandler();
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
