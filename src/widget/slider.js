/* global _, $, jQuery */
var RiseVision = RiseVision || {};

RiseVision.Slider = function( params, imageRef ) {
  "use strict";

  var totalSlides = 0,
    $api = null,
    currentFiles = null,
    newFiles = null,
    navTimer = null,
    slideTimer = null,
    isLastSlide = false,
    refreshSlider = false,
    isLoading = true,
    isPlaying = false,
    isInteracting = false,
    navTimeout = 3000,
    singleImagePUDTimer = null,
    imageUtils = RiseVision.ImageUtils;

  /*
   *  Private Methods
   */
  function getFileUrls() {
    var dfd = jQuery.Deferred(),
      urls = [],
      count = 0,
      i;

    function resolveCheck() {
      count += 1;

      if ( count === currentFiles.length ) {
        dfd.resolve( urls );
      }
    }

    for ( i = 0; i < currentFiles.length; i += 1 ) {
      if ( imageUtils.getUsingWatch() && imageUtils.isSVGImage( currentFiles[ i ].filePath ) ) {
        imageUtils.convertSVGToDataURL( currentFiles[ i ].filePath, currentFiles[ i ].url, function( dataUrl ) {
          if ( dataUrl ) {
            urls.push( dataUrl );
          }
          resolveCheck();
        } );
      } else {
        urls.push( currentFiles[ i ].url );
        resolveCheck();
      }
    }

    // Return the Promise so caller can't change the Deferred
    return dfd.promise();
  }

  function getSlideToAdd( url ) {
    var slide = document.createElement( "li" ),
      image = document.createElement( "img" ),
      position = "";

    // Transition
    slide.setAttribute( "data-transition", "fade" );
    slide.setAttribute( "data-masterspeed", 500 );
    slide.setAttribute( "data-delay", params.duration * 1000 );

    // Lazy load
    image.setAttribute( "src", "" );
    image.setAttribute( "data-lazyload", url );

    // Alignment
    switch ( params.position ) {
    case "top-left":
      position = "left top";
      break;
    case "top-center":
      position = "center top";
      break;
    case "top-right":
      position = "right top";
      break;
    case "middle-left":
      position = "left center";
      break;
    case "middle-center":
      position = "center center";
      break;
    case "middle-right":
      position = "right center";
      break;
    case "bottom-left":
      position = "left bottom";
      break;
    case "bottom-center":
      position = "center bottom";
      break;
    case "bottom-right":
      position = "right bottom";
      break;
    default:
      position = "left top";
    }

    image.setAttribute( "data-bgposition", position );

    // Scale to Fit
    if ( params.scaleToFit ) {
      image.setAttribute( "data-bgfit", "contain" );
    } else {
      image.setAttribute( "data-bgfit", "normal" );
    }

    slide.appendChild( image );

    return slide;
  }


  function addSlides( urls ) {
    var list = document.querySelector( ".tp-banner ul" ),
      fragment = document.createDocumentFragment(),
      slides = [];

    totalSlides = currentFiles.length;

    urls.forEach( function( url ) {
      slides.push( getSlideToAdd( url ) );
    } );

    slides.forEach( function( slide ) {
      fragment.appendChild( slide );
    } );

    list.appendChild( fragment );
  }

  function initSlider() {
    isLoading = true;
    $api = $( ".tp-banner" ).revolution( {
      "hideThumbs": 0,
      "hideTimerBar": "on",
      "navigationType": "none",
      "onHoverStop": "off",
      "startwidth": params.width,
      "startheight": params.height
    } );

    $api.on( "revolution.slide.onloaded", function() {
      // Pause slideshow since it will autoplay and this is not configurable.
      pause();
      isLoading = false;
      imageRef.onSliderReady();
    } );

    $api.on( "revolution.slide.onchange", function( e, data ) {
      onSlideChanged( data );
    } );

    // Swipe the slider.
    $( "body" ).on( "touchend", ".tp-banner", function() {
      handleUserActivity();
      $( ".tp-leftarrow, .tp-rightarrow" ).removeClass( "hidearrows" );
    } );

    // Touch the navigation arrows.
    $( "body" ).on( "touchend", ".tp-leftarrow, .tp-rightarrow", function() {
      handleUserActivity();
    } );

    hideNav();
  }

  function onSlideChanged( data ) {
    if ( isInteracting ) {
      pause();
    } else {
      // Don't call "done" if user is interacting with the slideshow.
      if ( isLastSlide ) {
        isLastSlide = false;
        pause();
        imageRef.onSliderComplete();

        if ( refreshSlider ) {
          // Destroy and recreate the slider if the files have changed.
          if ( $api ) {
            destroySlider();
            init( newFiles );
          }

          refreshSlider = false;
        }
      }
    }

    if ( data.slideIndex === totalSlides ) {
      isLastSlide = true;
    }
  }

  function destroySlider() {
    // Remove event handlers.
    $( "body" ).off( "touchend" );
    $api.off( "revolution.slide.onloaded" );
    $api.off( "revolution.slide.onchange" );

    // Let the slider clean up after itself.
    $api.revkill();
    $api = null;
    totalSlides = 0;
    isLastSlide = false;
    refreshSlider = false;
    isLoading = true;
    isPlaying = false;
    isInteracting = false;
  }

  // User has interacted with the slideshow.
  function handleUserActivity() {
    isInteracting = true;
    clearTimeout( slideTimer );

    // Move to next slide and resume the slideshow after a delay.
    slideTimer = setTimeout( function() {
      $api.revnext();
      $api.revresume();

      isInteracting = false;
      isPlaying = true;
    }, params.pause * 1000 );

    hideNav();
  }

  // Hide the navigation after a delay.
  function hideNav() {
    if ( params.autoHide ) {
      clearTimeout( navTimer );

      navTimer = setTimeout( function() {
        $( ".tp-leftarrow, .tp-rightarrow" ).addClass( "hidearrows" );
      }, navTimeout );
    }
  }

  function startSingleImagePUDTimer() {
    var delay = ( ( params.duration === undefined ) || ( params.duration < 1 ) ) ? 10000 : params.duration * 1000;

    singleImagePUDTimer = setTimeout( function() {
      imageRef.onSliderComplete();
    }, delay );
  }

  /*
   *  Public Methods
   *  TODO: Test what happens when folder isn't found.
   */
  function destroy() {
    if ( $api ) {
      isLastSlide = false;
      pause();
      destroySlider();
    }
  }

  function getCurrentSlide() {
    if ( $api && currentFiles && currentFiles.length > 0 ) {
      return $api.revcurrentslide();
    }

    return -1;
  }

  function init( files ) {
    var tpBannerContainer = document.querySelector( ".tp-banner-container" ),
      fragment = document.createDocumentFragment(),
      tpBanner = document.createElement( "div" ),
      ul = document.createElement( "ul" );

    tpBanner.setAttribute( "class", "tp-banner" );
    tpBanner.appendChild( ul );
    fragment.appendChild( tpBanner );
    tpBannerContainer.appendChild( fragment );

    currentFiles = _.clone( files );

    $.when( getFileUrls() )
      .then( function( urls ) {
        addSlides( urls );
        initSlider();
      } );
  }

  function isReady() {
    return !isLoading;
  }

  function play() {
    if ( $api ) {
      // Reset slideshow to first slide.
      if ( params.hasOwnProperty( "resume" ) && !params.resume ) {
        $api.revshowslide( 0 );
      }

      if ( !isPlaying ) {
        $api.revresume();
        isPlaying = true;
      }

      if ( currentFiles.length === 1 ) {
        startSingleImagePUDTimer();
      }
    }
  }

  function pause() {
    if ( $api && isPlaying ) {
      $api.revpause();
      isPlaying = false;
    }

    if ( singleImagePUDTimer ) {
      clearTimeout( singleImagePUDTimer );
    }
  }

  function refresh( files ) {
    // Start preloading images right away.
    RiseVision.Common.Utilities.preloadImages( files );

    if ( currentFiles.length === 1 ) {
      // Destroy and recreate the slider immediately if currently only 1 slide and there has been a change.
      if ( $api ) {
        clearTimeout( singleImagePUDTimer );
        destroySlider();
        init( _.clone( files ) );
      }
    } else {
      newFiles = _.clone( files );
      refreshSlider = true;
    }

  }

  return {
    "getCurrentSlide": getCurrentSlide,
    "destroy": destroy,
    "init": init,
    "isReady": isReady,
    "play": play,
    "pause": pause,
    "refresh": refresh
  };
};
