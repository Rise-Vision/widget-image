/* global requests, suiteSetup, suiteTeardown, suite, test, assert, RiseVision, sinon */

/* eslint-disable func-names */

var ready = false,
  isV2Running = false,
  requests,
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
  if ( isV2Running ) {
    requests[ 0 ].respond( 404 );
    requests[ 1 ].respond( 200 );
  } else {
    requests[ 0 ].respond( 200 );
  }

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

suite( "empty folder", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-empty-folder", {
      "detail": null,
      "bubbles": true
    } ) );
  } );

  test( "should show the no image message", function() {
    assert.equal( document.querySelector( ".message" ).innerHTML, "The selected folder does not contain any images." );
  } );
} );

suite( "no folder", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-no-folder", {
      "detail": null,
      "bubbles": true
    } ) );
  } );

  test( "should show no folder message", function() {
    assert.equal( document.querySelector( ".message" ).innerHTML, "The selected folder does not exist or has been moved to Trash.", "message is correct" );
  } );
} );

suite( "invalid folder format", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-folder-invalid", {
      "detail": null,
      "bubbles": true
    } ) );
  } );

  test( "should show format(s) invalid message", function() {
    assert.equal( document.querySelector( ".message" ).innerHTML, "The selected folder does not contain any supported image formats." );
  } );
} );

suite( "no storage subscription", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-subscription-expired" ) );
  } );

  test( "should show the storage subscription not active message", function() {
    assert.equal( document.querySelector( ".message" ).innerHTML, "Rise Storage subscription is not active.", "message is correct" );
  } );
} );

suite( "storage api error", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-api-error", {
      "detail": {
        "result": false,
        "code": 500,
        "message": "Could not retrieve Bucket Items"
      },
      "bubbles": true
    } ) );
  } );

  test( "should show the storage api error message", function() {
    assert.equal( document.querySelector( ".message" ).innerHTML, "Sorry, there was a problem communicating with Rise Storage.", "message is correct" );
  } );
} );

suite( "storage error", function() {
  test( "should show storage error message", function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-error", {
      "detail": {
        "error": {
          "currentTarget": {
            "status": 0
          }
        } },
      "bubbles": true
    } ) );

    assert.equal( document.querySelector( ".message" ).innerHTML, "Sorry, there was a problem communicating with Rise Storage.", "message text" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "block" ), "message visibility" );
  } );

  test( "should call play function 5 seconds after a storage error", function() {
    var clock = sinon.useFakeTimers(),
      spy = sinon.spy( RiseVision.Image, "play" );

    storage.dispatchEvent( new CustomEvent( "rise-storage-error", {
      "detail": {
        "error": {
          "currentTarget": {
            "status": 0
          }
        } },
      "bubbles": true
    } ) );

    clock.tick( 4500 );
    assert( spy.notCalled );
    clock.tick( 500 );
    assert( spy.calledOnce );

    clock.restore();
    RiseVision.Image.play.restore();
  } );
} );

suite( "rise cache error", function() {
  test( "should show rise cache error message", function() {
    storage.dispatchEvent( new CustomEvent( "rise-cache-error", {
      "detail": {
        "error": {
          "message": "The request failed with status code: 500"
        } },
      "bubbles": true
    } ) );

    assert.equal( document.querySelector( ".message" ).innerHTML, "There was a problem retrieving the file from Rise Cache.", "message text" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "block" ), "message visibility" );
  } );

  test( "should show rise cache error message for 404 status", function() {
    storage.dispatchEvent( new CustomEvent( "rise-cache-error", {
      "detail": {
        "error": {
          "message": "The request failed with status code: 404"
        } },
      "bubbles": true
    } ) );

    assert.equal( document.querySelector( ".message" ).innerHTML, "The file does not exist or cannot be accessed.", "message text" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "block" ), "message visibility" );
  } );

  test( "should show rise cache error message for 507 status", function() {
    storage.dispatchEvent( new CustomEvent( "rise-cache-error", {
      "detail": {
        "error": {
          "message": "The request failed with status code: 507"
        } },
      "bubbles": true
    } ) );

    assert.equal( document.querySelector( ".message" ).innerHTML, "There is not enough disk space to save the file on Rise Cache.", "message text" );
    assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "block" ), "message visibility" );
  } );

  test( "should call play function 5 seconds after a rise cache error", function() {
    var clock = sinon.useFakeTimers(),
      spy = sinon.spy( RiseVision.Image, "play" );

    storage.dispatchEvent( new CustomEvent( "rise-cache-error", {
      "detail": {
        "error": {
          "message": "The request failed with status code: 500"
        } },
      "bubbles": true
    } ) );

    clock.tick( 4500 );
    assert( spy.notCalled );
    clock.tick( 500 );
    assert( spy.calledOnce );

    clock.restore();
    RiseVision.Image.play.restore();
  } );
} );

suite( "rise cache not running", function() {
  test( "should show rise cache not running message using rise-storage v2", function() {
    if ( isV2Running ) {
      storage.dispatchEvent( new CustomEvent( "rise-cache-not-running", {
        "detail": {
          "resp": {
            "error": {
              "message": "The request failed with status code: 404"
            }
          },
          "isPlayerRunning": true
        },
        "bubbles": true
      } ) );

      assert.equal( document.querySelector( ".message" ).innerHTML, "Waiting for Rise Cache", "message text" );
      assert.isTrue( ( document.getElementById( "messageContainer" ).style.display === "block" ), "message visibility" );
    }
  } );

  test( "should call play function 5 seconds after a rise cache not running error using rise-storage v2", function() {
    var clock = sinon.useFakeTimers(),
      spy = sinon.spy( RiseVision.Image, "play" );

    if ( isV2Running ) {
      storage.dispatchEvent( new CustomEvent( "rise-cache-not-running", {
        "detail": {
          "resp": {
            "error": {
              "message": "The request failed with status code: 404"
            }
          },
          "isPlayerRunning": true
        },
        "bubbles": true
      } ) );

      clock.tick( 4500 );
      assert( spy.notCalled );
      clock.tick( 500 );
      assert( spy.calledOnce );

      clock.restore();
      RiseVision.Image.play.restore();
    }

  } );
} );
