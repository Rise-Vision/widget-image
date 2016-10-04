sinon.stub(RiseVision.Common.RiseCache, "isV2Running", function (callback) {
  requests = [];
  xhr = sinon.useFakeXMLHttpRequest();

  xhr.onCreate = function (xhr) {
    requests.push(xhr);
  };

  RiseVision.Common.RiseCache.isV2Running.restore();
  RiseVision.Common.RiseCache.isV2Running(callback);
});

sinon.stub(RiseVision.Image, "setAdditionalParams", function (params, mode) {
  ready = true;

  storage = document.querySelector("rise-storage");
  // No need to make requests to Storage via the component since events are triggered manually
  // for these test cases.
  sinon.stub(storage, "_getStorageSubscription", function () {});

  RiseVision.Image.setAdditionalParams.restore();
  RiseVision.Image.setAdditionalParams(params, mode);
});
