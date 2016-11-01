/*
 * The file wraps all browser specific extension apis that are used in content scripts page so we can use same interface
 * to call browser specific apis from different browsers.
 */
var BS = new (function() {

  var me = this;

  this.browser = "chrome";

  this.reviewLink = "https://chrome.google.com/webstore/detail/coupons-at-checkout/kegphgaihkjoophpabchkmpaknehfamb/reviews";

  this.storeName = "Chrome store";

  this.sendMessage = chrome.runtime.sendMessage;

  this.sendRequest = chrome.extension.sendRequest;

  this.onMessage = function(callback) {
    chrome.runtime.onMessage.addListener(callback);
  };

  this.getURL = chrome.runtime.getURL;

  this.getIframeUrl = this.getURL;

  this.openPopup = function(url, options) {
    BS.sendMessage({method: "openPopup", url: url, options: options});
  };

  this.lscache = {
    get: function(key, callback) {
      me.sendMessage({ method: "cacheGet", key: key }, callback);
    },
    set: function(key, value, expireTime) {
      me.sendMessage({ method: "cacheSet", key: key, value: value, expireTime: expireTime });
    }
  };

})();
