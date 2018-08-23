/* global beforeEach, afterEach, describe, it, expect, sinon, RiseVision */

/* eslint-disable func-names */

"use strict";

describe( "getTableName", function() {
  it( "should return the correct table name", function() {
    expect( RiseVision.ImageUtils.getTableName(), "image_events" );
  } );
} );

describe( "getStorageFileName", function() {
  it( "should provide file name from storage file path (bucket only)", function() {
    expect( RiseVision.ImageUtils.getStorageFileName( "risemedialibrary-abc123/test-file.jpg" ) ).to.equal( "test-file.jpg" );
  } );

  it( "should provide file name from storage file path (with subfolder)", function() {
    expect( RiseVision.ImageUtils.getStorageFileName( "risemedialibrary-abc123/test-folder/nested-folder/test-file.jpg" ) ).to.equal( "test-file.jpg" );
  } );

  it( "should provide file name from storage file path (bucket only) when name has special characters", function() {
    expect( RiseVision.ImageUtils.getStorageFileName( "risemedialibrary-abc123/([!@?,#$])=1+2-A | <>.jpg" ) ).to.equal( "([!@?,#$])=1+2-A | <>.jpg" );
    expect( RiseVision.ImageUtils.getStorageFileName( "risemedialibrary-abc123/test %.jpg" ) ).to.equal( "test %.jpg" );
    expect( RiseVision.ImageUtils.getStorageFileName( "risemedialibrary-abc123/test *.jpg" ) ).to.equal( "test *.jpg" );
    expect( RiseVision.ImageUtils.getStorageFileName( "risemedialibrary-abc123/test Ü.jpg" ) ).to.equal( "test Ü.jpg" );
  } );

  it( "should provide file name from storage file path (with subfolder) when name has special characters", function() {
    expect( RiseVision.ImageUtils.getStorageFileName( "risemedialibrary-abc123/test-folder/nested-folder/([!@?,#$])=1+2-A | <>.jpg" ) ).to.equal( "([!@?,#$])=1+2-A | <>.jpg" );
    expect( RiseVision.ImageUtils.getStorageFileName( "risemedialibrary-abc123/test-folder/nested-folder/test %.jpg" ) ).to.equal( "test %.jpg" );
    expect( RiseVision.ImageUtils.getStorageFileName( "risemedialibrary-abc123/test-folder/nested-folder/test *.jpg" ) ).to.equal( "test *.jpg" );
    expect( RiseVision.ImageUtils.getStorageFileName( "risemedialibrary-abc123/test-folder/nested-folder/test Ü.jpg" ) ).to.equal( "test Ü.jpg" );
  } );
} );

describe( "isSVGImage", function() {
  it( "should return true when file path is for an SVG file", function() {
    expect( RiseVision.ImageUtils.isSVGImage( "risemedialibrary-abc123/test-folder/test-file.svg" ) ).to.be.true;
  } );

  it( "should return false when file path is not for an SVG file", function() {
    expect( RiseVision.ImageUtils.isSVGImage( "risemedialibrary-abc123/test-folder/test-file.jpg" ) ).to.be.false;
  } );
} );

describe( "logEvent", function() {
  var logSpy;

  beforeEach( function() {
    logSpy = sinon.spy( RiseVision.Common.LoggerUtils, "logEvent" );
  } );

  afterEach( function() {
    RiseVision.Common.LoggerUtils.logEvent.restore();
  } );

  it( "should call spy with correct parameters when all optional parameters are set", function() {
    var params = {
      "event": "test",
      "event_details": "test details",
      "file_url": "http://www.test.com/file.jpg",
      "file_format": "jpg",
      "configuration": "",
      "company_id": "",
      "display_id": ""
    };

    RiseVision.ImageUtils.logEvent( {
      "event": "test",
      "event_details": "test details",
      "file_url": "http://www.test.com/file.jpg"
    } );

    expect( logSpy ).to.have.been.calledWith( "image_events", params );
  } );

  it( "should call spy with correct parameters when only the event is set", function() {
    var params = {
      "event": "test",
      "configuration": "",
      "company_id": "",
      "display_id": ""
    };

    RiseVision.ImageUtils.logEvent( { "event": "test" } );

    expect( logSpy ).to.have.been.calledWith( "image_events", params );
  } );

} );
