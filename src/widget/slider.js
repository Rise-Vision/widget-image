/* global _ */
var RiseVision = RiseVision || {};

RiseVision.Image = RiseVision.Image || {};

RiseVision.Image.Slider = function( params ) {
  "use strict";

  var totalSlides = 0,
    // $api = null,
    currentFiles = null,
    newFiles = null,
    slideTimer = null,
    isLastSlide = false,
    isLoading = true,
    isInteracting = false,
    singleImagePUDTimer = null,
    slideIndex = 0,
    refreshSlider = false,
    slides = [];

  /*
   *  Private Methods
   */
  function addSlides() {
    var container = document.querySelector( ".tp-banner-container" ),
      image = null,
      position = "",
      index = 0;

    slides = [];
    while ( container.firstChild ) {
      container.removeChild( container.firstChild );
    }
    totalSlides = currentFiles.length;

    currentFiles.forEach( function( file ) {
      image = document.createElement( "img" );

      // Transition
      // slide.setAttribute( "data-transition", "fade" );
      // slide.setAttribute( "data-masterspeed", 500 );
      // slide.setAttribute( "data-delay", params.duration * 1000 );

      // Lazy load
      image.src = file.url;
      image.className = "w3-animate-fading";

      if ( index == 0 ) {
        image.onload = function() {
          isLoading = false;
          RiseVision.Image.onSliderReady();
        }
      }

      index++;

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
        image.style.height = "100%";
        image.style.width = "100%";
      }

      container.appendChild( image );
      slides.push( image );
    } );

    // slides.forEach( function( slide ) {
    //   fragment.appendChild( slide );
    // } );

    // list.appendChild( fragment );
  }

  function onSlideChanged() {
    if ( isInteracting ) {
      pause();
    } else {
      // Don't call "done" if user is interacting with the slideshow.
      if ( isLastSlide ) {
        isLastSlide = false;
        pause();
        RiseVision.Image.onSliderComplete();

        if ( refreshSlider ) {
          init( newFiles );
          refreshSlider = false;
        }
      }
    }

    if ( slideIndex === totalSlides ) {
      isLastSlide = true;
    }
  }

  // function destroySlider() {
  //   // Remove event handlers.
  //   $( "body" ).off( "touchend" );
  //   $api.off( "revolution.slide.onloaded" );
  //   $api.off( "revolution.slide.onchange" );

  //   // Let the slider clean up after itself.
  //   $api.revkill();
  //   $api = null;
  // }

  // User has interacted with the slideshow.
  // function handleUserActivity() {
  //   isInteracting = true;
  //   clearTimeout( slideTimer );


  //   // Move to next slide and resume the slideshow after a delay.
  //   slideTimer = setTimeout( function() {
  //     isInteracting = false;
  //     carousel();
  //   }, params.pause * 1000 );
  // }

  function carousel() {
    var i;

    clearTimeout( slideTimer );
    for ( i = 0; i < slides.length; i++ ) {
      slides[ i ].style.display = "none";
    }
    slideIndex++;
    if ( slideIndex > slides.length ) {
      slideIndex = 1;
    }
    slides[ slideIndex - 1 ].style.display = "block";
    onSlideChanged();
    slideTimer = setTimeout( carousel, params.pause * 1000 );
  }

  // Hide the navigation after a delay.
  // function hideNav() {
  //   if ( params.autoHide ) {
  //     clearTimeout( navTimer );

  //     navTimer = setTimeout( function() {
  //       $( ".tp-leftarrow, .tp-rightarrow" ).addClass( "hidearrows" );
  //     }, navTimeout );
  //   }
  // }

  function startSingleImagePUDTimer() {
    var delay = ( ( params.duration === undefined ) || ( params.duration < 1 ) ) ? 10000 : params.duration * 1000;

    singleImagePUDTimer = setTimeout( function() {
      RiseVision.Image.onSliderComplete();
    }, delay );
  }

  /*
   *  Public Methods
   *  TODO: Test what happens when folder isn't found.
   */
  function destroy() {
    isLastSlide = false;
    pause();
    // if ( $api ) {
    //   isLastSlide = false;
    //   pause();
    //   destroySlider();
    // }
  }

  function getCurrentSlide() {
    return slideIndex;
  }

  function init( files ) {
    // var tpBannerContainer = document.querySelector( ".tp-banner-container" ),
    //   fragment = document.createDocumentFragment(),
    //   tpBanner = document.createElement( "div" ),
    //   ul = document.createElement( "ul" );

    // tpBanner.setAttribute( "class", "tp-banner" );
    // tpBanner.appendChild( ul );
    // fragment.appendChild( tpBanner );
    // tpBannerContainer.appendChild( fragment );

    currentFiles = _.clone( files );

    addSlides();

    isLoading = true;
    // $api = $( ".tp-banner" ).revolution( {
    //   "hideThumbs": 0,
    //   "hideTimerBar": "on",
    //   "navigationType": "none",
    //   "onHoverStop": "off",
    //   "startwidth": params.width,
    //   "startheight": params.height
    // } );

    // $api.on( "revolution.slide.onloaded", function() {
    //   // Pause slideshow since it will autoplay and this is not configurable.
    //   pause();
    //   isLoading = false;
    //   RiseVision.Image.onSliderReady();
    // } );

    // $api.on( "revolution.slide.onchange", function( e, data ) {
    //   onSlideChanged( data );
    // } );

    // // Swipe the slider.
    // $( "body" ).on( "touchend", ".tp-banner", function() {
    //   handleUserActivity();
    //   $( ".tp-leftarrow, .tp-rightarrow" ).removeClass( "hidearrows" );
    // } );

    // // Touch the navigation arrows.
    // $( "body" ).on( "touchend", ".tp-leftarrow, .tp-rightarrow", function() {
    //   handleUserActivity();
    // } );

    // hideNav();
  }

  function isReady() {
    return !isLoading;
  }

  function play() {
    if ( params.hasOwnProperty( "resume" ) && !params.resume ) {
      slideIndex = 0;
    }

    if ( currentFiles.length === 1 ) {
      startSingleImagePUDTimer();
    } else {
      carousel();
    }
  }

  function pause() {
    clearTimeout( slideTimer );

    if ( singleImagePUDTimer ) {
      clearTimeout( singleImagePUDTimer );
    }
  }

  function refresh( files ) {
    // Start preloading images right away.
    RiseVision.Common.Utilities.preloadImages( files );

    if ( currentFiles.length === 1 ) {
      clearTimeout( singleImagePUDTimer );
      init( files );
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
