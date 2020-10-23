/* global suiteSetup, suite, test, assert, RiseVision, sinon, setup, teardown */

/* eslint-disable func-names */

var ready = false,
  isV2Running = false, // eslint-disable-line
  storage,
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

suite( "waiting", function() {
  test( "should show waiting message", function() {
    assert.equal( document.querySelector( ".message" ).innerHTML, "Please wait while your image is downloaded.", "message is correct" );
  } );
} );

suite( "normal storage response", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "added": true,
        "name": "Widgets/simpson's.jpg",
        "url": "https://storage.googleapis.com/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/Widgets%2Fsimpson's.jpg"
      },
      "bubbles": true
    } ) );
  } );

  test( "should not show a message", function() {
    assert.isTrue( ( document.getElementById( "container" ).style.visibility === "visible" ), "image container is showing" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "none" ), "message container is hidden" );
  } );
} );

suite( "cache file unavailable", function() {

  setup( function() {
    sinon.stub( RiseVision.Image, "play" );
  } )

  teardown( function() {
    RiseVision.Image.play.restore();
  } );

  test( "should show file unavailable message", function() {
    storage.dispatchEvent( new CustomEvent( "rise-cache-file-unavailable", {
      "detail": {
        "status": 202,
        "message": "File is downloading"
      },
      "bubbles": true
    } ) );

    assert.equal( document.querySelector( ".message" ).innerHTML, "File is downloading", "message text" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "block" ), "message visibility" );
  } );

  test( "should not display message and ensure image is visible when file becomes available", function() {
    // file is unavailable
    storage.dispatchEvent( new CustomEvent( "rise-cache-file-unavailable", {
      "detail": {
        "status": 202,
        "message": "File is downloading"
      },
      "bubbles": true
    } ) );

    // storage provides file
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "changed": true,
        "name": "Widgets/simpson's.jpg",
        "url": "https://storage.googleapis.com/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/Widgets%2Fsimpson's.jpg"
      },
      "bubbles": true
    } ) );

    // image should be visible
    assert.isTrue( ( document.getElementById( "container" ).style.visibility === "visible" ), "image container is showing" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "none" ), "message container is hidden" );
  } );
} );
