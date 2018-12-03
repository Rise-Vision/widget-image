/* global require, browser, describe, beforeEach, it, element, by */

/* eslint-disable func-names */

( function() {
  "use strict";

  var chai = require( "chai" ),
    chaiAsPromised = require( "chai-as-promised" ),
    expect = chai.expect;

  chai.use( chaiAsPromised );

  describe( "Image Settings - e2e Testing", function() {
    var validImageUrl = "http://s3.amazonaws.com/rise-common/images/logo-small.png",
      invalidImageFormat = "http://s3.amazonaws.com/rise-common/images/small.tiff";

    beforeEach( function() {
      browser.get( "/src/settings-e2e.html" );
    } );

    // Loading
    it( "Should load single image button", function() {
      expect( element( by.css( "storage-selector[type='single-file']" ) ).isPresent() ).to.eventually.be.true;
    } );

    it( "Should load folder button", function() {
      expect( element( by.css( "storage-selector[type='single-folder']" ) ).isPresent() ).to.eventually.be.true;
    } );

    it( "Should load custom URL button", function() {
      expect( element( by.name( "customBtn" ) ).isPresent() ).to.eventually.be.true;
    } );

    it( "Should load alignment dropdown", function() {
      expect( element( by.name( "position" ) ).isPresent() ).to.eventually.be.true;
    } );

    it( "Should load save button", function() {
      expect( element( by.id( "save" ) ).isPresent() ).to.eventually.be.true;
    } );

    it( "Should load cancel button", function() {
      expect( element( by.id( "cancel" ) ).isPresent() ).to.eventually.be.true;
    } );

    // Defaults
    it( "Resume Playing from Last Position should be checked", function() {
      expect( element( by.model( "settings.additionalParams.resume" ) ).isSelected() ).to.eventually.be.true;
    } );

    it( "Scale to Fit should be checked", function() {
      expect( element( by.model( "settings.additionalParams.scaleToFit" ) ).isSelected() ).to.eventually.be.true;
    } );

    it( "Alignment should be middle-center", function() {
      expect( element( by.name( "position" ) ).getAttribute( "value" ) ).to.eventually.equal( "middle-center" );
    } );

    it( "Duration should be 10", function() {
      expect( element( by.model( "settings.additionalParams.duration" ) ).getAttribute( "value" ) ).to.eventually.equal( "10" );
    } );

    it( "Resume Playing After should be 10", function() {
      expect( element( by.model( "settings.additionalParams.pause" ) ).getAttribute( "value" ) ).to.eventually.equal( "10" );
    } );

    it( "Auto Hide Navigation should be unchecked", function() {
      expect( element( by.model( "settings.additionalParams.autoHide" ) ).isSelected() ).to.eventually.be.false;
    } );

    // Visibility
    it( "Should hide Resume Playing from Last Position", function() {
      expect( element( by.model( "settings.additionalParams.resume" ) ).isDisplayed() ).to.eventually.be.false;
    } );

    it( "Should hide Duration", function() {
      expect( element( by.model( "settings.additionalParams.duration" ) ).isDisplayed() ).to.eventually.be.false;
    } );

    it( "Should hide Resume Playing After", function() {
      expect( element( by.model( "settings.additionalParams.pause" ) ).isDisplayed() ).to.eventually.be.false;
    } );

    it( "Should hide Auto Hide Navigation", function() {
      expect( element( by.model( "settings.additionalParams.autoHide" ) ).isDisplayed() ).to.eventually.be.false;
    } );

    // Validity
    it( "ng-valid should be false", function() {
      expect( element( by.css( "form[name=settingsForm].ng-valid" ) ).isPresent() ).to.eventually.be.false;
    } );

    it( "Save button should be disabled", function() {
      expect( element( by.css( "#save[disabled=disabled" ) ).isPresent() ).to.eventually.be.true;
    } );

    it( "Save button should be enabled when a valid image URL is entered", function() {
      element( by.name( "customBtn" ) ).click();
      element( by.name( "url" ) ).sendKeys( validImageUrl );

      expect( element( by.css( "#save[disabled=disabled]" ) ).isPresent() ).to.eventually.be.false;
    } );

    it( "ng-valid should be true when a valid image URL is entered", function() {
      element( by.name( "customBtn" ) ).click();
      element( by.name( "url" ) ).sendKeys( validImageUrl );

      expect( element( by.css( "form[name=settingsForm].ng-valid" ) ).isPresent() ).to.eventually.be.true;
    } );

    it( "Save button should be disabled for an invalid file format", function() {
      element( by.name( "customBtn" ) ).click();
      element( by.name( "url" ) ).sendKeys( invalidImageFormat );

      expect( element( by.css( "#save[disabled=disabled]" ) ).isPresent() ).to.eventually.be.true;
    } );

    it( "ng-valid should be false for an invalid file format", function() {
      element( by.name( "customBtn" ) ).click();
      element( by.name( "url" ) ).sendKeys( invalidImageFormat );

      expect( element( by.css( "form[name=settingsForm].ng-valid" ) ).isPresent() ).to.eventually.be.false;
    } );

    it( "Should not hang with invalid url", function() {
      // This was causing a hang similar to that of widget-web-page issue 98
      var badUrl = "dfasfadfsadfsadfasdfafsadfsafsadfadfafaddsfasdfsdasfdadsafafafsdfs";

      element( by.name( "customBtn" ) ).click();
      element( by.name( "url" ) ).sendKeys( badUrl );

      expect( element( by.css( "form[name=settingsForm].ng-valid" ) ).isPresent() ).to.eventually.be.false;
    } );

    // Saving
    it( "Should correctly save settings", function() {
      var settings = {
        "params": {},
        "additionalParams": {
          "selector": {
            "selection": "custom",
            "storageName": "",
            "url": validImageUrl
          },
          "storage": {},
          "resume": true,
          "scaleToFit": true,
          "position": "middle-center",
          "duration": 10,
          "pause": 10,
          "autoHide": false,
          "url": "",
          "background": {}
        }
      };

      element( by.css( "#file-selector button[name='customBtn']" ) ).click();
      element( by.css( "#file-selector input[name='url']" ) ).sendKeys( validImageUrl );
      element( by.id( "save" ) ).click();

      expect( browser.executeScript( "return window.result" ) ).to.eventually.deep.equal( {
        "params": "",
        "additionalParams": JSON.stringify( settings.additionalParams )
      } );
    } );
  } );
} )();
