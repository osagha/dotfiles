/*
 * Coupons at Checkout Browser Extension
 * Copyright (c) 2012, 2013 CouponFollow, LLC.  All rights reserved.
 * Copying this source code in any manner is strictly prohibited.
 */

"use strict";

// in case of firefox, the files needs to be included here
if (!BS) {
  var BS = require("data/browserSpecific/backgroundApiWrapper.js").BS;
  var lscache = require("data/lib/lscache.js").lscache;
  var Config = require("data/config.js").Config;
  var utils = require("data/utils.js").utils;

  exports.BS = BS;
}

var background = new (function(window, undefined) {

  var pageContexts = {},
      supportedSites = null,
      disabledTabs = {},
      extensionVersion = BS.getVersion(),
      userId = null,
      me = this;

  function init()
  {
    // set extension version as global header so that it's sent in all ajax requests
    utils.headers["CATC-Version"] = extensionVersion;
    utils.headers["CATC-Env"] = Config.environment;

    setUserId(function() {
      addListeners();

      // cache supported sites when extension loads
      fetchSupportedSites();
    });

    BS.onExtensionUpdated(onExtensionUpdated);
  }

  function setUserId(callback) {
    BS.storage.sync.get('userId', function(items) {
      userId = items.userId;
      if (!userId) {
        userId = generateUUID();

        BS.storage.sync.set({ userId: userId });
		
        //set userId remotely, and returns their country code
        utils.remoteGet(Config.apiBase + "/setUser?uid=" + userId, function(response, status) {
        if (status == 200)
          {
          //return response;
          }
        });
      }

      // set CATC-UserId header as a global header so it's sent in all ajax requests
      utils.headers["CATC-UserId"] = userId;

      /*$.ajaxSetup({
        headers: utils.headers
      });*/

      callback();
    });
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16).toUpperCase();
    });
  }

  function onExtensionUpdated(prevVersion, loadReason) {
    var currVersion = BS.getVersion();
    var currMajVersion = currVersion.split(".")[0];

    if (typeof prevVersion !== "undefined") {
      var prevMajVersion = prevVersion.split(".")[0];
    }

    if (currMajVersion != prevMajVersion) {
      if (typeof prevVersion == 'undefined' && loadReason != "upgrade") {
        BS.tabs.create({url: 'http://couponfollow.com/checkout/' + BS.browser + '/success?ref=' + currVersion});
      } else {
        BS.tabs.create({url: 'http://couponfollow.com/checkout/' + BS.browser + '/updated?ref=' + currVersion});
      }
    }

    if (currVersion != prevVersion) {
      BS.localStorage.setItem('version', currVersion);
    }
  }

  function addListeners()
  {
    /*** Popup button disabled for now, paste following in manifest.json to enable ***/
    /*
     "browser_action": {
     "default_icon": {
     "19": "images/catc2-32.png",
     "38": "images/catc2-32.png"
     },
     "default_title": "Coupons at Checkout"
     },
     */

    // start auto-apply when popup button is clicked
    /*chrome.browserAction.onClicked.addListener(function (tab) {
      startAutoApply(tab.id);
    });*/

    // shortcut command start auto-apply
    BS.commands.onCommand.addListener(onCommand);

    // listen for messages from contentScripts
    BS.onMessage(onMessageReceived);

    BS.setUninstallURL('http://couponfollow.com/checkout/goodbye?uid=' + userId);
  }

  function onMessageReceived(request, sender, sendResponse) {
    if (request.for == "iframe" || request.for == "mainWindow") {
      // contentScript cannot directly send messages to an extension's iframe, so the background page acts as a proxy
      // to send from contentScript to iframe and vice versa
      BS.tabs.sendMessage(sender.tab.id, request);
    }
    else {
      if (request.method === 'savePageContext') {
        // save page context (current auto-apply state) in background page to preserve the auto-apply state for
        // non-ajax sites during page loads
        savePageContext(sender.tab.id, request.domain, request.context);
      } else if (request.method === 'getPageContext') {
        // send page context (current auto-apply state) from background page to contentScript
        var context = getPageContext(sender.tab.id, request.domain);
        sendResponse(context);
      } else if (request.method === 'removePageContext') {
        // clears page context for a site, used when user cancels auto-apply process or the process gets completed
        removePageContext(sender.tab.id, request.domain);
      } else if (request.method === "startAutoApply") {
        startAutoApply(sender.tab.id);
      } else if (request.method === "getSettings") {
        // send current extension's settings to contentScript
        me.getSettings(sendResponse);
        return true;
      }
      else if (request.method == "getInitData") {
        getInitData(sender.tab.id, request.domain, sendResponse);
        return true;
      }
      else if (request.method === "isSiteSupported") {
        // checks if a site is supported
        isSiteSupported(request.domain, function(siteSupported) {
          sendResponse(siteSupported);
        });
        return true;
      }
      else if (request.method === "cacheGet") {
        sendResponse(lscache.get(request.key));
      }
      else if (request.method === "cacheSet") {
        lscache.set(request.key, request.value, request.expireTime);
      }
      else if (request.method === "disableAutoApplyForTab") {
        disableAutoApplyForTab(sender.tab.id, request.domain);
      }
      else if (request.method === "isAutoApplyDisabledForTab") {
        sendResponse(isAutoApplyDisabledForTab(sender.tab.id, request.domain));
      }
      else if (request.method === "backgroundLinkOpen") {
        me.backgroundLinkOpen(request.url);
      }
      else if (request.method === "openPopup") {
        BS.openPopup(request.url, request.options);
      }
      else if (request.method === "getActiveTab") {
        BS.tabs.query({currentWindow: true, active: true}, function (tabs) {
          if (tabs.length > 0) {
            var tab = {
              id: tabs[0].id,
              url: tabs[0].url
            };
            sendResponse(tab);
          }
          else {
            sendResponse(null);
          }
        });
        return true;
      }
      else if (request.method === "storage.sync.get") {
        BS.storage.sync.get(request.keys, sendResponse);
        return true;
      }
      else if (request.method === "storage.sync.set") {
        BS.storage.sync.set(request.keysValues);
      }
      else if (request.method === "progressRequest") {
        var domain = utils.extractDomain(sender.tab.url);
        var context = getPageContext(sender.tab.id, domain);

        if (context) {
          sendProgressUpdate(sender.tab.id, context);
        }
        else {
          // if context is not available in background page, relay the message to content script as the content script
          // will have access to old context and can respond appropriately
          BS.tabs.sendMessage(sender.tab.id, request);
        }
      }
    }
  }

  function sendProgressUpdate(tabId, context) {
    var applyingCodeNum = context.iteration + 1;
    if (applyingCodeNum > context.codes.length) {
      if (context.bestIteration != -1) {
        msgToIframe(tabId, { method: "applyingBestCode" });
      }
      else {
        // if all codes are applied and there's no best code to apply next, show that it's still applying the last code
        msgToIframe(tabId, { method: "applyingNextCode", totalCodes: context.codes.length, current: applyingCodeNum - 1 });
      }
    }
    else {
      msgToIframe(tabId, { method: "applyingNextCode", totalCodes: context.codes.length, current: applyingCodeNum });
    }
  }

  function msgToIframe(tabId, message) {
    message.for = "iframe";
    message.from = "background";
    BS.tabs.sendMessage(tabId, message);
  }

  // starts auto-apply when user presses Ctrl+Shift+4
  function onCommand (command) {
    switch (command) {
      case "start_auto_apply":
        BS.tabs.query({currentWindow: true, active: true}, function (tabs) {
          if (tabs.length > 0) {
            startAutoApply(tabs[0].id);
          }
        });
        break;
    }
  }

  // sends message to background page to start auto-apply
  function startAutoApply(tabId) {
    BS.tabs.sendMessage(tabId, {
      method: 'beginAutoApplyStartedByUser'
    });
    //TODO: Open tab and communicate what's happening with it.
    //var action_url = "chrome-extension://hpleghakngpmnhdhpgkofmpmmjhgelkf/working.html" // + "?url=" + encodeURIComponent(tab.href)
    //chrome.tabs.create({ url: action_url });
  }

  function savePageContext(tabId, domain, context) {
    pageContexts[domain + "_" + tabId] = context;
  }

  function getPageContext(tabId, domain) {
    return pageContexts[domain + "_" + tabId];
  }

  function removePageContext(tabId, domain) {
    delete pageContexts[domain + "_" + tabId];
  }

  // fetches supported sites list from server
  function fetchSupportedSites(callback) {
    utils.remoteGet(Config.apiBase + "/getSupportedSites", function(response, status) {
      if (status == 200)
      {
        supportedSites = response.split(",");
        if (callback) {
          callback();
        }
      }
    });
  }

  // loads supported sites to cache (if not already loaded) and  checks if a domain is in the supported sites list
  function isSiteSupported(domain, callback) {
    if (supportedSites == null) {
      fetchSupportedSites(function() {
        matchSupportedSites(domain, callback);
      });
    }
    else {
      matchSupportedSites(domain, callback);
    }
  }

  // checks if a domain is in the supported sites list
  function matchSupportedSites(domain, callback) {
    var rootDomain = utils.getRootDomain(domain);

    for (var i=0; i<supportedSites.length; i++) {
      if (supportedSites[i] == domain ||supportedSites[i] == rootDomain)
      {
        callback(true);
        return;
      }
    }

    callback(false);
  }

  function disableAutoApplyForTab(tabId, domain) {
    disabledTabs[tabId + ":" + domain] = true;
  }

  function isAutoApplyDisabledForTab(tabId, domain) {
    return disabledTabs[tabId + ":" + domain];
  }

  function getInitData(tabId, domain, callback) {
    me.getSettings(function(settings) {
      var initData = {settings: settings};
      initData.cartKeywords = cf.cartKeywords;
      initData.inputKeywords = cf.inputKeywords;
      initData.AACartKeywords = cf.AACartKeywords;
      initData.context = getPageContext(tabId, domain);
      callback(initData);
    });
  }

  this.backgroundLinkOpen = function(url) {
    utils.remoteGet(url);
  };

  this.getSettings = function(callback) {
    BS.storage.sync.get({
      highlight: "Yes",
      showAutoApplyBox: "Yes",
      userId: null
    }, function(settings) {
      settings.extensionVersion = extensionVersion;
      callback(settings)
    });
  };

  init();
})();

// need to export in case of firefox so it can be accessed in other files
if (typeof exports !== "undefined") {
  exports.background = background;

  // include auto_reveal at the end to avoid circular dependency (as data/background.js is also included in data/auto_reveal/background.js)
  var auto_reveal = require("data/auto_reveal/background.js");
  var cf = auto_reveal.cf;
}
