/* global suiteTeardown, test, assert, RiseVision, sinon */

/* eslint-disable func-names */

var isV2Running = false;

sinon.stub( RiseVision.Common.RiseCache, "isV2Running", function( callback ) {
  sinon.stub( RiseVision.Image, "setAdditionalParams" );

  RiseVision.Common.RiseCache.isV2Running.restore();
  RiseVision.Common.RiseCache.isV2Running( callback( isV2Running ) );
} );

suiteTeardown( function() {
  RiseVision.Image.setAdditionalParams.restore();
} );

test( "rise-storage element should be added to body", function() {
  assert.isNotNull( document.querySelector( "rise-storage" ) );
} );
