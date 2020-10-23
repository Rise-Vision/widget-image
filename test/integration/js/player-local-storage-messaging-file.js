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

suite( "file downloading", function() {
  var clock;

  setup( function() {
    clock = sinon.useFakeTimers();
    sinon.stub( RiseVision.ImageRLS, "play" );
  } );

  teardown( function() {
    clock.restore();
    RiseVision.ImageRLS.play.restore();
  } );

  test( "should show message after 15 seconds of processing", function() {
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

suite( "errors", function() {
  setup( function() {
    sinon.stub( RiseVision.ImageRLS, "play" );
  } );

  teardown( function() {
    RiseVision.ImageRLS.play.restore();
  } );

  test( "nothing is displayed", function() {
    messageHandlers.forEach( function( handler ) {
      handler( {
        topic: "file-update",
        filePath: "risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        status: "NOEXIST"
      } );
    } );

    assert.isTrue( ( document.getElementById( "container" ).style.visibility === "hidden" ), "image container is hidden" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "block" ), "message container is visible" );
    assert.equal( document.querySelector( ".message" ).innerHTML, "", "message is empty" );
  } );
} );
