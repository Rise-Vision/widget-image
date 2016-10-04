sinon.stub(RiseVision.Common.RiseCache, "isV2Running", function (callback) {
  xhr = sinon.useFakeXMLHttpRequest();

  xhr.onCreate = function (xhr) {
    requests.push(xhr);
  };

  requests = [];

  RiseVision.Common.RiseCache.isV2Running.restore();
  RiseVision.Common.RiseCache.isV2Running(callback);
});

sinon.stub(RiseVision.Image, "setAdditionalParams", function (params, mode) {
  ready = true;

  storage = document.querySelector("rise-storage");
  // No need to make requests to Storage via the component since events are triggered manually
  // for these test cases.
  sinon.stub(storage, "_getStorageSubscription", function () {});

  // spy on log call
  spy = sinon.spy(RiseVision.Common.Logger, "log");

  // restore the function
  RiseVision.Image.setAdditionalParams.restore();

  // call it again with the params
  RiseVision.Image.setAdditionalParams(params, mode);

  storage.dispatchEvent(new CustomEvent("rise-storage-response", {
    "detail": {
      "added": true,
      "name": "images/Gone_Girl_Book_Cover.jpg",
      "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/o/images%2FGone_Girl_Book_Cover.jpg?alt=media"
    },
    "bubbles": true
  }));

  storage.dispatchEvent(new CustomEvent("rise-storage-response", {
    "detail": {
      "added": true,
      "name": "images/Gated_Book_Cover.jpg",
      "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-b428b4e8-c8b9-41d5-8a10-b4193c789443/o/images%2FGated_Book_Cover.jpg?alt=media"
    },
    "bubbles": true
  }));
});
