/* global RiseVision, sinon, requests, storage */

/* eslint-disable func-names, no-global-assign */

sinon.stub( RiseVision.Common.RiseCache, "isV2Running", function( callback ) {
  RiseVision.Common.RiseCache.isV2Running.restore();
  RiseVision.Common.RiseCache.isV2Running( callback(isV2Running) );
} );

sinon.stub( RiseVision.Image, "setAdditionalParams", function( params, mode, displayId ) {
  ready = true; // eslint-disable-line no-undef

  storage = document.querySelector( "rise-storage" );
  // No need to make requests to Storage via the component since events are triggered manually
  // for these test cases.
  sinon.stub( storage, "_getStorageSubscription", function() {} );

  RiseVision.Image.setAdditionalParams.restore();
  RiseVision.Image.setAdditionalParams( params, mode, displayId );
} );
