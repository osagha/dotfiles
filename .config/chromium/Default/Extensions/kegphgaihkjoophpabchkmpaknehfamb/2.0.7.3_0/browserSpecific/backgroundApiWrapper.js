/*
 * The file wraps all browser specific extension apis that are used in background/event page so we can use same interface
 * to call browser specific apis from different browsers.
 */
var BS = new (function() {

  this.browser = "chrome";

  this.reviewLink = "https://chrome.google.com/webstore/detail/coupons-at-checkout/kegphgaihkjoophpabchkmpaknehfamb/reviews";

  this.tabs = chrome.tabs;

  this.localStorage = localStorage;

  this.storage = chrome.storage;

  this.onMessage = function(callback) {
    chrome.runtime.onMessage.addListener(callback);
  };

  this.onRequest = this.onMessage;

  this.commands = chrome.commands;

  this.windows = chrome.windows;

  this.setUninstallURL = chrome.runtime.setUninstallURL;

  this.lscache = {
    get: function(key, callback) {
      callback(lscache.get(key));
    },
    set: lscache.set
  };

  this.getVersion = function() {
    return chrome.app.getDetails().version
  };

  this.openPopup = function(url, options) {
    if (options.centerAlign) {
      options.left = Math.round((screen.width / 2) - (options.width / 2));
      options.top = Math.round((screen.height / 2) - (options.height / 2) - 40);
    }

    chrome.windows.create({
      url: url,
      left: options.left,
      top: options.top,
      width: options.width,
      height: options.height,
      type: "panel"
    });
  };

  this.onExtensionUpdated = function(callback) {
    chrome.runtime.onInstalled.addListener(function(details) {
      if (details.reason == "install" || details.reason == "update") {
        callback(details.previousVersion);
      }
    });
  };

  this.getActiveTab = function(callback) {
    BS.tabs.query({currentWindow: true, active: true}, function (tabs) {
      if (tabs.length > 0) {
        var tab = {
          id: tabs[0].id,
          url: tabs[0].url
        };
        callback(tab);
      }
      else {
        callback(null);
      }
    });
  };

})();
