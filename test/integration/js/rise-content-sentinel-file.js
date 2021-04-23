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

suite( "file added", function() {
  var onFileInitSpy;

  suiteSetup( function( done ) {
    onFileInitSpy = sinon.spy( RiseVision.ImageWatch, "onFileInit" );

    receivedExpected = 2;
    callback = done;

    // mock receiving file-update to notify file is downloading
    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
      status: "STALE"
    }, "*" );

    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
      status: "CURRENT"
    }, "*" );
  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileInit.restore();
    receivedCounter = 0;
    receivedExpected = 0;
    callback = null;
  } );

  test( "should be able to set single image with correct url", function() {
    assert( onFileInitSpy.calledOnce, "onFileInit() called once" );
    assert( onFileInitSpy.calledWith( "https://widgets.risevision.com/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg" ), "onFileInit() called with correct url" );
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

  suiteSetup( function( done ) {
    refreshSpy = sinon.spy( RiseVision.ImageWatch, "onFileRefresh" );

    receivedExpected = 2;
    callback = done;

    // mock receiving file-update to notify file is downloading
    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
      status: "STALE"
    }, "*" );

    // mock receiving file-update to notify file is available
    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
      status: "CURRENT"
    }, "*" );
  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileRefresh.restore();
    receivedCounter = 0;
    receivedExpected = 0;
    callback = null;
  } );

  test( "should be able to update single file url", function() {
    assert( refreshSpy.calledOnce );
    assert( refreshSpy.calledWith( "https://widgets.risevision.com/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg" ), "onFileRefresh() called with correct url" );
  } );
} );

suite( "file deleted", function() {
  var onFileDeletedStub;

  suiteSetup( function( done ) {
    onFileDeletedStub = sinon.stub( RiseVision.ImageWatch, "onFileDeleted" );

    receivedExpected = 1;
    callback = done;

    // mock receiving file-update to notify file is downloading
    window.postMessage( {
      topic: "FILE-UPDATE",
      filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
      status: "DELETED"
    }, "*" );
  } );

  suiteTeardown( function() {
    RiseVision.ImageWatch.onFileDeleted.restore();
    receivedCounter = 0;
    receivedExpected = 0;
    callback = null;
  } );

  test( "should display error and clear image", function() {
    assert.equal( onFileDeletedStub.calledOnce, true );
  } );
} );
