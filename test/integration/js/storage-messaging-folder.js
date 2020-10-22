/* global suiteSetup, suiteTeardown, suite, test, assert, RiseVision, sinon */

/* eslint-disable func-names */

var ready = false,
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
    assert.equal( document.querySelector( ".message" ).innerHTML, "Please wait while your image is downloaded." );
  } );
} );

suite( "normal storage response", function() {
  var sliderReadySpy = sinon.spy( RiseVision.Image, "onSliderReady" ),
    check = function( done ) {
      if ( sliderReadySpy && sliderReadySpy.calledOnce ) {
        done();
      } else {
        setTimeout( function() {
          check( done )
        }, 1000 );
      }

    };

  suiteSetup( function( done ) {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "added": true,
        "name": "images/Gone_Girl_Book_Cover.jpg",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/o/images%2FGone_Girl_Book_Cover.jpg?alt=media"
      },
      "bubbles": true
    } ) );

    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "added": true,
        "name": "images/Gated_Book_Cover.jpg",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/o/images%2FThe_Girl_On_The_Train_Cover.jpg?alt=media"
      },
      "bubbles": true
    } ) );

    check( done );
  } );

  suiteTeardown( function() {
    RiseVision.Image.onSliderReady.restore();
  } );

  test( "should not show a message", function() {
    assert.isTrue( ( document.getElementById( "container" ).style.visibility === "visible" ), "image container is showing" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "none" ), "message container is hidden" );
  } );
} );
