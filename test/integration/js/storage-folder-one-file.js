/* global suiteSetup, suite, test, assert, suiteTeardown */

/* eslint-disable func-names */

var ready = false,
  isV2Running = false, // eslint-disable-line no-unused-vars
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

suite( "folder with one file", function() {

  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "added": true,
        "name": "widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGone_Girl_Book_Cover.jpg?alt=media"
      },
      "bubbles": true
    } ) );
  } );

  suiteTeardown( function() {
  } );

  test( "should initialize and add one image slide", function( done ) {
    setTimeout( function() {
      assert.equal( document.querySelectorAll( ".tp-revslider-mainul .tp-revslider-slidesli" ).length, 1, "num of slides" );
      assert.equal( document.querySelector( ".tp-revslider-mainul .tp-revslider-slidesli:nth-child(1) .tp-bgimg" ).getAttribute( "data-lazyload" ), "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGone_Girl_Book_Cover.jpg?alt=media", "one slide" );

      done();
    }, 8000 );
  } );

} );

suite( "folder with one file - change", function() {
  suiteSetup( function() {
    storage.dispatchEvent( new CustomEvent( "rise-storage-response", {
      "detail": {
        "changed": true,
        "name": "widget-testing/image-widget/Gone_Girl_Book_Cover.jpg",
        "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGone_Girl_Book_Cover.jpg?alt=media&cb=0"
      },
      "bubbles": true
    } ) );

  } );

  test( "should update image", function( done ) {
    setTimeout( function() {
      assert.equal( document.querySelector( ".tp-revslider-mainul .tp-revslider-slidesli:nth-child(1) .tp-bgimg" ).getAttribute( "src" ), "https://www.googleapis.com/storage/v1/b/risemedialibrary-30007b45-3df0-4c7b-9f7f-7d8ce6443013/o/widget-testing%2Fimage-widget%2FGone_Girl_Book_Cover.jpg?alt=media&cb=0" );
      done();
    }, 8000 );
  } );
} );
