/*jshint expr:true */
"use strict";

describe("Unit Tests - Settings Controller", function () {

  var defaultSettings, scope, rootScope, ctrl;

  beforeEach(module("risevision.widget.image.settings"));

  beforeEach(inject(function($injector, $rootScope, $controller, _commonSettings_) {
    defaultSettings = $injector.get("defaultSettings");
    scope = $rootScope.$new();
    rootScope = $rootScope;

    ctrl = $controller("imageSettingsController", {
      $scope: scope,
      commonSettings: _commonSettings_
    });

    scope.settingsForm = {
      $setValidity: function () {
        return;
      },
      imageUrl: {
        $valid: true
      }
    };

    scope.settings = {
      additionalParams: defaultSettings.additionalParams
    };

  }));

  it("should define defaultSettings", function (){
    expect(defaultSettings).to.be.truely;
    expect(defaultSettings).to.be.an("object");
  });

  it("should define additionalParams.storage with valid storage url", function() {
    var url = "https://storage.googleapis.com/risemedialibrary-abc123/Widgets%2Ftest.jpg";

    // make a valid storage folder url entry
    scope.settings.additionalParams.selector.url = url;
    scope.$digest();

    expect(scope.settings.additionalParams.storage).to.deep.equal({
      "companyId": "abc123",
      "folder": "Widgets/",
      "fileName": "test.jpg"
    });
  });

  it("should reset additionalParams.storage with invalid storage folder url", function() {
    var url = "http:/ww";

    // make an invalid storage folder url entry
    scope.settings.additionalParams.selector.url = url;
    scope.settingsForm.imageUrl.$valid = false;
    scope.$digest();

    expect(scope.settings.additionalParams.storage).to.deep.equal({});
  });

  it("should reset additionalParams.storage with invalid url", function() {
    var url = "https://storage.googleapis.com/risemedialibrary-abc123/Widgets%2Ftest.jpg";

    // make an initial correct entry
    scope.settings.additionalParams.selector.url = url;
    scope.$digest();

    // make an invalid url entry
    scope.settings.additionalParams.selector.url = "http:/ww";
    scope.settingsForm.imageUrl.$valid = false;
    scope.$digest();

    expect(scope.settings.additionalParams.storage).to.deep.equal({});
  });

  it("should handle pre merge 'url' property for a storage file", function() {
    var url = "https://storage.googleapis.com/risemedialibrary-abc123/Widgets%2Ftest.jpg";

    // force a 'url' value to simulate a previously saved Settings
    scope.settings.additionalParams.url = url;
    scope.$digest();

    expect(scope.settings.additionalParams.selector).to.deep.equal({
      "selection": "single-file",
      "storageName": "Widgets/test.jpg",
      "url": url
    });

    expect(scope.settings.additionalParams.storage).to.deep.equal({
      "companyId": "abc123",
      "folder": "Widgets/",
      "fileName": "test.jpg"
    });
  });

  it("should handle pre merge 'url' property for a non-storage file", function() {
    var url = "http://s3.amazonaws.com/images/test.jpg";

    // force a 'url' value to simulate a previously saved Settings
    scope.settings.additionalParams.url = url;
    scope.$digest();

    expect(scope.settings.additionalParams.selector).to.deep.equal({
      "selection": "custom",
      "storageName": "",
      "url": url
    });

    expect(scope.settings.additionalParams.storage).to.deep.equal({});
  });

  // it("should check resume by default if it has not been set", function() {
  //   scope.settings.additionalParams.resume = undefined;
  //   scope.$digest();

  //   expect(scope.settings.additionalParams.resume).to.be.true;
  // });

  it("Should set isFolder to true when folder is selected", function () {
    scope.$digest();

    rootScope.$broadcast("fileSelectorClick", "single-folder");

    expect(scope.isFolder).to.be.true;
  });

  it("Should set isFolder to false when folder is not selected", function () {
    scope.$digest();

    rootScope.$broadcast("fileSelectorClick", "custom");

    expect(scope.isFolder).to.be.false;
  });
});
