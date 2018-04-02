var RiseVision = RiseVision || {};

RiseVision.Image = RiseVision.Image || {};

RiseVision.Image.Utils = ( function() {
  "use strict";

  /*
   *  Public  Methods
   */

  function getImageElement( params ) {
    var el = document.createElement( "div" );

    el.setAttribute( "id", "image" );
    el.className = params.position;
    el.className = params.scaleToFit ? el.className + " scale-to-fit" : el.className;

    return el;
  }

  return {
    "getImageElement": getImageElement
  };

} )();
