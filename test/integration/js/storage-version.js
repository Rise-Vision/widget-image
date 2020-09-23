/* global suiteSetup, suiteTeardown, test, assert, RiseVision, sinon */

/* eslint-disable func-names */

var isV2Running = false,
  xhr,
  requests;

sinon.stub( RiseVision.Common.RiseCache, "isV2Running", function( callback ) {
  sinon.stub( RiseVision.Image, "setAdditionalParams" );

  RiseVision.Common.RiseCache.isV2Running.restore();
  RiseVision.Common.RiseCache.isV2Running( callback(isV2Running) );
} );

/*suiteSetup( function() {
  console.log("hello");
  if ( !isV2Running ) {
    requests[ 0 ].respond( 200 );
  } else {
    requests[ 0 ].respond( 404 );
    requests[ 1 ].respond( 200 );
  }
} );*/

suiteTeardown( function() {
  RiseVision.Image.setAdditionalParams.restore();
} );

test( "rise-storage element should be added to body", function() {
  assert.isNotNull( document.querySelector( "rise-storage" ) );
} );
