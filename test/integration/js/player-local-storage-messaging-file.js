/* global suiteSetup, suite, setup, teardown, test, assert,
 RiseVision, sinon */

/* eslint-disable func-names */

var ready = false,
  messageHandlers,
  logSpy,
  check = function( done ) {
    if ( ready ) {
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

teardown( function() {
  logSpy.restore();
} );

suite( "waiting", function() {
  test( "should show waiting message", function() {
    assert.equal( document.querySelector( ".message" ).innerHTML, "Please wait while your image is downloaded.", "message is correct" );
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

    // mock 30 more client-list messages sent/received
    for ( i = 30; i >= 0; i-- ) {
      receiveClientList();
      clock.tick( 1000 );
    }

    assert.equal( document.querySelector( ".message" ).innerHTML, "There was a problem retrieving the file." );
  } );

  test( "unauthorized", function() {
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

    assert.equal( document.querySelector( ".message" ).innerHTML, "Rise Storage subscription is not active." );
  } );

  test( "file does not exist", function() {
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
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        status: "NOEXIST"
      } );
    } );

    assert.equal( document.querySelector( ".message" ).innerHTML, "The selected image does not exist or has been moved to Trash." );
  } );

  test( "file error", function() {
    var clock = sinon.useFakeTimers(),
      spy = sinon.spy( RiseVision.ImageRLS, "play" );

    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "file-error",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        msg: "File's host server could not be reached",
        detail: "error details"
      } );
    } );

    assert.equal( document.querySelector( ".message" ).innerHTML, "Unable to download the file." );

    clock.tick( 4500 );
    assert( spy.notCalled );
    clock.tick( 500 );
    assert( spy.calledOnce );

    clock.restore();
    RiseVision.ImageRLS.play.restore();
  } );

} );

suite( "file downloading", function() {
  var clock;

  setup( function() {
    clock = sinon.useFakeTimers();
  } );

  teardown( function() {
    clock.restore();
  } );

  test( "should show message after 15 seconds of processing", function() {

    // file is getting processed, starts the initial processing timer
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "FILE-UPDATE",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        status: "STALE"
      } );
    } );

    // expire initial processing timer
    clock.tick( 15000 );

    assert.equal( document.querySelector( ".message" ).innerHTML, "File is downloading." );

  } );

} );

suite( "file deleted", function() {
  test( "file deleted", function() {
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

    // mock receiving file-update to notify file is deleted
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "file-update",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        status: "deleted"
      } );
    } );

    assert.isTrue( ( document.getElementById( "container" ).style.visibility === "hidden" ), "image container is hidden" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "block" ), "message container is visible" );
    assert.equal( document.querySelector( ".message" ).innerHTML, "The selected image has been moved to Trash." );
  } );

  test( "file re-added", function() {
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

    assert.isTrue( ( document.getElementById( "container" ).style.visibility === "visible" ), "image container is visible" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "none" ), "message container is hidden" );
  } );
} );
