/* global RiseVision, sinon, config */

/* eslint-disable func-names, no-global-assign */

config.TEST_USE_SENTINEL = true;

sinon.stub( RiseVision.Common.Utilities, "isServiceWorkerRegistered", function() {
  return Promise.resolve();
} )

sinon.stub( RiseVision.ImageWatch, "setAdditionalParams", function( params, mode ) {
  ready = true; // eslint-disable-line no-undef
  // spy on log call
  logSpy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" ); // eslint-disable-line no-undef

  RiseVision.ImageWatch.setAdditionalParams.restore();
  RiseVision.ImageWatch.setAdditionalParams( params, mode, "b428b4e8-c8b9-41d5-8a10-b4193c789443", "sentinel" );
} );
