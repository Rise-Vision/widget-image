/* global RiseVision, gadgets, config, version */
( function( window, document, gadgets ) {
  "use strict";

  var id = new gadgets.Prefs().getString( "id" ),
    useRLS = false;

  window.oncontextmenu = function() {
    return false;
  };

  document.body.onmousedown = function() {
    return false;
  };

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
      mode,
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
          // storage file or folder selected
          if ( !additionalParams.storage.fileName ) {
            // folder was selected
            mode = "folder";

            // integration tests set TEST_USE_RLS to true
            useRLS = config.TEST_USE_RLS || canUseRLSFolder();
          } else {
            // file was selected
            mode = "file";

            // integration tests set TEST_USE_RLS to true
            useRLS = config.TEST_USE_RLS || canUseRLSSingleFile();
          }
        } else {
          // non-storage file was selected
          mode = "file";
        }

        if ( useRLS ) {
          // proceed with using RLS for single file
          RiseVision.ImageRLS.setAdditionalParams( additionalParams, mode, companyId );
          return;
        }

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
    }
  }

  function pause() {
    if ( !useRLS ) {
      RiseVision.Image.pause();
    } else {
      RiseVision.ImageRLS.pause();
    }
  }

  function play() {
    if ( !useRLS ) {
      RiseVision.Image.play();
    } else {
      RiseVision.ImageRLS.play();
    }
  }

  function stop() {
    if ( !useRLS ) {
      RiseVision.Image.stop();
    } else {
      RiseVision.ImageRLS.stop();
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
