/*
 * Coupons at Checkout Browser Extension
 * Copyright (c) 2012, 2013 CouponFollow, LLC.  All rights reserved.
 * Copying this source code in any manner is strictly prohibited.  
 */

"use strict";

// in case of firefox, the files needs to be included here
if (!BS) {
  var BS = require("data/browserSpecific/backgroundApiWrapper.js").BS;
  var Config = require("data/config.js").Config;
  var utils = require("data/utils.js").utils;
  var background = require("data/background.js").background;

  var timers = require("sdk/timers");
  var setTimeout = timers.setTimeout;
  var clearTimeout = timers.clearTimeout;
}

var storage = BS.storage.local;

var cf = {

  history: [],
  helpers: {},
  blacklist: {},
  updates: {},
  cartKeywords: null,
  AACartKeywords: null,
  inputKeywords: null,

  init: function() {
    storage.get({helpers: {}, blacklist: {}, updates: {}}, function(items) {
      cf.helpers = items.helpers;
      cf.blacklist = items.blacklist;
      cf.updates = items.updates;
      cf.checkUpdates();
    });

    BS.onRequest(requestHandler);
  },

  checkUpdates: function() {
    utils.remoteGet('http://couponfollow.com/api/Extension/getInit', function(updates) {

      // Check and update helpers
      var helpersLocalTime = Date.parse(cf.updates.helpersUpdated);
      var helpersRemoteTime = Date.parse(updates.helpersUpdated);
      if (helpersLocalTime) {
        if (helpersLocalTime < helpersRemoteTime) {
          cf.updateHelpers();
        }
      } else {
        cf.updateHelpers();
      }

      // Check and update blacklist
      var blacklistLocalTime = Date.parse(cf.updates.blacklistUpdated);
      var blacklistRemoteTime = Date.parse(updates.blacklistUpdated);
      if (blacklistLocalTime) {
        if (blacklistLocalTime < blacklistRemoteTime) {
          cf.updateBlacklist();
        }
      } else {
        cf.updateBlacklist();
      }

      cf.updates = updates;
      storage.set({'updates': cf.updates});

      cf.cartKeywords = updates.CartKeywords;
      cf.AACartKeywords = updates.CartStrictKeywords;
      cf.inputKeywords = updates.InputKeywords;
    });
  },

  updateHelpers: function() {
    utils.remoteGet('http://couponfollow.com/api/Extension/getHelpers', function(data) {
      cf.helpers = {};
      if (data.records > 0) {
        for (var i = 0; i < data.helpers.length; i++) {
          var helper = data.helpers[i];
          cf.helpers[helper.domainName] = helper;
        }
      }
      storage.set({'helpers': cf.helpers});
    });
  },

  updateBlacklist: function() {
    utils.remoteGet('http://couponfollow.com/api/Extension/getBlacklist', function(data) {
      cf.blacklist = {};
      for (var i = 0; i < data.blacklistDomains.length; i++) {
        var domain = data.blacklistDomains[i];
        cf.blacklist[domain] = "1";
      }
      storage.set({'blacklist': cf.blacklist});
    });
  }
};

setTimeout(function () { cf.init(); }, 1000);

function requestHandler(request, sender, sendResponse) {
  if (request.call == "pasteCoupon") {
    pasteCoupon(request.arg);
  } else if (request.call == "cf") {
    sendResponse(cf);
  } else if (request.call == "markVisited") {
    markVisited(request.arg);
  } else if (request.call == "getHistory") {
    getHistory(request.arg, sendResponse);
	  return true;
  }
}

function pasteCoupon(data) {
  if (data.nt == 1) {
    background.backgroundLinkOpen(Config.domain + 'code/go/' + data.id);
  }

  data.method = "pasteCoupon";

  BS.tabs.query({currentWindow: true, active: true}, function (tabs) {
    if (tabs.length > 0) {
      var tab = tabs[0];
      BS.tabs.sendMessage(tab.id, data);
    }
  });
}

function markVisited(domain) {
  BS.tabs.query({currentWindow: true, active: true}, function (tabs) {
    if (tabs.length > 0) {
      var tab = tabs[0];
      if (cf.history[tab.id] == undefined) {
        cf.history[tab.id] = [];
      }
      if (!utils.contains(cf.history[tab.id], domain)) {
        if (cf.history[tab.id].length == 3) {
          cf.history[tab.id].shift();
        }
        cf.history[tab.id].push(domain);
      }
    }
  });
}

function getHistory(data, sendResponse) {
  BS.tabs.query({currentWindow: true, active: true}, function (tabs) {
    if (tabs.length > 0) {
      var tab = tabs[0];
      cf.history[tab.id].pop();
      var toSend = {
        history: cf.history[tab.id].join(','),
        point: data.point
      };
      sendResponse(toSend);
    }
  });
}

if (typeof exports !== "undefined") {
  exports.cf = cf;
}