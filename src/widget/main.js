/* global RiseVision, gadgets, config, version */
( function( window, document, gadgets ) {
  "use strict";

  var id = new gadgets.Prefs().getString( "id" ),
    utils = RiseVision.Common.Utilities,
    useWatch = false;

  window.oncontextmenu = function() {
    return false;
  };

  document.body.onmousedown = function() {
    return false;
  };

  function _isFolder( additionalParams ) {
    return !additionalParams.storage.fileName;
  }

  function _canUseRLS( mode ) {
    // integration tests will set TEST_USE_RLS to true
    if ( mode === "folder" ) {
      return config.TEST_USE_RLS || canUseRLSFolder();
    }

    return config.TEST_USE_RLS || canUseRLSSingleFile();
  }

  function _configureStorageUsage( additionalParams, displayId, companyId ) {
    var mode = _isFolder( additionalParams ) ? "folder" : "file";

    // integration tests will set TEST_USE_SENTINEL to true
    if ( utils.useContentSentinel() || config.TEST_USE_SENTINEL ) {
      return utils.isServiceWorkerRegistered()
        .then( function() {
          useWatch = true;
          RiseVision.ImageWatch.setAdditionalParams( additionalParams, mode, companyId, "sentinel" );
        } )
        .catch( function( err ) {
          console.log( err ); // eslint-disable-line no-console
        } );
    }

    if ( _canUseRLS( mode ) ) {
      useWatch = true;
      return RiseVision.ImageWatch.setAdditionalParams( additionalParams, mode, companyId, "rls" );
    }

    _processStorageNonWatch( additionalParams, mode, displayId )
  }

  function _processStorageNonWatch( additionalParams, mode, displayId ) {
    // check which version of Rise Cache is running and dynamically add rise-storage dependencies
    RiseVision.Common.RiseCache.isRCV2Player( function( isV2 ) {
      var fragment = document.createDocumentFragment(),
        link = document.createElement( "link" ),
        href = config.COMPONENTS_PATH + ( ( isV2 ) ? "rise-storage-v2" : "rise-storage" ) + "/rise-storage.html",
        storage = document.createElement( "rise-storage" );

      function init() {
        RiseVision.Image.setAdditionalParams( additionalParams, mode, displayId );
      }

      function onStorageReady() {
        storage.removeEventListener( "rise-storage-ready", onStorageReady );
        init();
      }

      link.setAttribute( "rel", "import" );
      link.setAttribute( "href", href );

      // add the rise-storage <link> element to document head
      document.getElementsByTagName( "head" )[ 0 ].appendChild( link );

      storage.setAttribute( "refresh", 5 );

      if ( isV2 ) {
        storage.setAttribute( "usage", "widget" );
      }

      storage.addEventListener( "rise-storage-ready", onStorageReady );
      fragment.appendChild( storage );

      // add the <rise-storage> element to the body
      document.body.appendChild( fragment );
    } );
  }

  function canUseRLSSingleFile() {
    try {
      if ( top.useRLSSingleFile ) {
        return true;
      }
    } catch ( err ) {
      console.log( "widget-image", err ); // eslint-disable-line no-console
    }

    return false;
  }

  function canUseRLSFolder() {
    try {
      if ( top.useRLSFolder ) {
        return true;
      }
    } catch ( err ) {
      console.log( "widget-image", err ); // eslint-disable-line no-console
    }

    return false;
  }

  function configure( names, values ) {
    var additionalParams,
      companyId = "",
      displayId = "";

    if ( Array.isArray( names ) && names.length > 0 && Array.isArray( values ) && values.length > 0 ) {
      // company id
      if ( names[ 0 ] === "companyId" ) {
        companyId = values[ 0 ];
      }

      // display id
      if ( names[ 1 ] === "displayId" ) {
        if ( values[ 1 ] ) {
          displayId = values[ 1 ];
        } else {
          displayId = "preview";
        }
      }

      // provide LoggerUtils the ids to use
      RiseVision.Common.LoggerUtils.setIds( companyId, displayId );
      RiseVision.Common.LoggerUtils.setVersion( version );
      RiseVision.Common.LoggerUtils.startEndpointHeartbeats( "widget-image" );

      // additional params
      if ( names[ 2 ] === "additionalParams" ) {
        additionalParams = JSON.parse( values[ 2 ] );

        if ( Object.keys( additionalParams.storage ).length !== 0 ) {
          _configureStorageUsage( additionalParams, displayId, companyId );
        } else {
          // non-storage file was selected
          RiseVision.Image.setAdditionalParams( additionalParams, "file", displayId );
        }
      }
    }
  }

  function pause() {
    if ( !useWatch ) {
      RiseVision.Image.pause();
    } else {
      RiseVision.ImageWatch.pause();
    }
  }

  function play() {
    if ( !useWatch ) {
      RiseVision.Image.play();
    } else {
      RiseVision.ImageWatch.play();
    }
  }

  function stop() {
    if ( !useWatch ) {
      RiseVision.Image.stop();
    } else {
      RiseVision.ImageWatch.stop();
    }
  }

  if ( id && id !== "" ) {
    gadgets.rpc.register( "rscmd_play_" + id, play );
    gadgets.rpc.register( "rscmd_pause_" + id, pause );
    gadgets.rpc.register( "rscmd_stop_" + id, stop );
    gadgets.rpc.register( "rsparam_set_" + id, configure );
    gadgets.rpc.call( "", "rsparam_get", null, id, [ "companyId", "displayId", "additionalParams" ] );
  }

} )( window, document, gadgets );
