/* global beforeEach, afterEach, describe, it, expect, sinon, RiseVision */

/* eslint-disable func-names */

"use strict";

describe( "getTableName", function() {
  it( "should return the correct table name", function() {
    expect( RiseVision.ImageUtils.getTableName(), "image_events" );
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
      "company_id": "",
      "display_id": ""
    };

    RiseVision.ImageUtils.logEvent( { "event": "test" } );

    expect( logSpy ).to.have.been.calledWith( "image_events", params );
  } );

  it( "should call spy twice if event is 'done' and a previous error exists", function() {
    var params = {
      "event": "error",
      "event_details": "error details",
      "file_url": "http://www.test.com/file.jpg",
      "file_format": "jpg",
      "company_id": "",
      "display_id": ""
    };

    RiseVision.ImageUtils.logEvent( {
      "event": params.event,
      "event_details": params.event_details,
      "file_url": params.file_url
    } );

    RiseVision.ImageUtils.logEvent( {
      "event": "done",
      "file_url": params.file_url
    } );

    expect( logSpy.callCount ).to.equal( 2 );
    expect( logSpy.args[ 0 ][ 1 ] ).to.deep.equal( params );
    expect( logSpy.args[ 1 ][ 1 ] ).to.deep.equal( {
      "event": "done",
      "file_url": params.file_url,
      "file_format": "jpg",
      "company_id": "",
      "display_id": ""
    } );

  } );

} );
