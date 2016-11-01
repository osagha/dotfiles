/*
 * Coupons at Checkout Browser Extension
 * Copyright (c) 2012, 2013 CouponFollow, LLC.  All rights reserved.  Patent Pending.
 * Copying this source code in any manner is strictly prohibited.  
 */

"use strict";

if (!BS) {
  var Config = require("data/config.js").BS;
  var BS = require("data/browserSpecific/backgroundApiWrapper.js").BS;
  var XMLHttpRequest = require("sdk/net/xhr").XMLHttpRequest;
}

var utils = new (function(window, undefined) {

  var me = this,
    domainName = null;

  me.headers = [];

  me.cartKeywords = ["cart", "checkout", "basket", "order", "merchant.mvc", "shopping|bag", "process", "register", "shipping", 
    "commerce", "promotion", "customer", "mybag", "booking", "confirmation"
  ];
  // domain Specific keywords
  me.domSpecKeywords = {"jockey": "bag", "bloomingdales": "bag", "macys": "bag", "raise": "receipts/new"};
  var dskDomains = Object.keys(me.domSpecKeywords);

  this.isCart = function(customCartKeyword) {
    var cKeywords,
        isCart = false;

    // Add site specific cart keywords (if any) at the end
    if (customCartKeyword) {
      cKeywords = me.cartKeywords.concat(customCartKeyword);
    }
    else {
      cKeywords = me.cartKeywords;
    }

    var hostname = document.location.host;
    // exclude anything without a period (eg. localhost) and any subdomain as dev.* (eg. dev.carters.com), see issue #237
    if (hostname.indexOf(".") === -1 || hostname.indexOf("dev.") === 0) {
      return false;
    }

    var url = "";
    var dskDomain = me.containsAKeyword(document.location.hostname, dskDomains);

    //if basedomain is in list of domain specific keyword domains, use the specific domain keyword
    if (dskDomain) {
      var keyword = me.domSpecKeywords[dskDomain];
      url = document.location.href.toLowerCase();
      if (url.indexOf(keyword) !== -1) {
        isCart = true;
      }
    }
    else {
      // otherwise don't include base domain in searching, see #237
      url = (me.getSubdomain() + document.location.pathname + document.location.search + document.location.hash).toLowerCase();
    }

    // no need to check if we aready know that it's a cart page
    if (!isCart) {
      // Check if the user has landed on a cart page
      for (var i = 0; i < cKeywords.length; i++) {
        var keyword = cKeywords[i];
        if (isCartWordMatched(url, keyword)) {
          isCart = true;
          break;
        }
      }
    }

    if (isCart) {
      Logger.log("isCart: Cart page found using keyword '" + keyword + "'");
    }
    else {
      Logger.log("isCart: not a cart page.");
    }

    return isCart;
  };

  // checks if current page url contains any of the listed cart keywords
  function isCartWordMatched(url, cartKeyword) {
    var keywordParts = cartKeyword.split('|');

    var matched = true,
        keywordPart;

    for (var i = 0; i < keywordParts.length; i++) {
      keywordPart = keywordParts[i].toLowerCase();

      if (keywordPart.length === 0) {
        continue;
      }

      if (url.indexOf(keywordPart) === -1) {
        matched = false;
      }
    }

    return matched;
  }

  this.remoteGet = function(url, func) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    // set global headers
    if (me.headers) {
      for (var headerKey in me.headers) {
        if (me.headers.hasOwnProperty(headerKey)) {
          xhr.setRequestHeader(headerKey, me.headers[headerKey]);
        }
      }
    }

    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (func) {
          func(JSON.parse(xhr.responseText), xhr.status);
        }
      }
    };
    xhr.send();
  };

  this.remoteGetWithCache = function(cacheKey, expireTime, url, callback) {
    BS.sendMessage({ method: "cacheGet", key: cacheKey}, function(data) {
      if (data == null || !Config.useCache) {
        Logger.log('Cache miss');
        me.remoteGet(url, function(data, status) {
          if (status == 200) {
            BS.sendMessage({ method: "cacheSet", key: cacheKey, value: data, expireTime: expireTime });
          }
          callback(data, status);
        });
      }
      else {
        Logger.log('Cache hit');
        callback(data, 200);
      }
    });
  };

  // Extracts the domain from the given URL
  this.extractDomain = function(url) {
    var re = /^(?:f|ht)tp(?:s)?:\/\/([^\/]+)/i;

    url = url.toLowerCase();

    var matches = url.match(re);
    if (matches != null && matches.length > 0) {
      var domainName = matches[1].toString();

      domainName = domainName.replace(/cart(\d+)\./, "");
      domainName = domainName.replace(/www(\d*)\./, "");
      domainName = domainName.replace(/secure(\d+)\./, "");
      domainName = domainName.replace(/www\-(\w+)\./, "");
      domainName = domainName.replace(/(\w+)\-secure\./, "");
      domainName = domainName.replace(/secure-www\./, "");
      domainName = domainName.replace(/www-secure\./, "");
      domainName = domainName.replace(/secure\./, "");
      domainName = domainName.replace(/cart\./, "");
      domainName = domainName.replace(/ssl\./, "");
      domainName = domainName.replace(/secure-/, "");
      domainName = domainName.replace(/checkout\./, "");
      domainName = domainName.replace(/checkout-/, "");
      domainName = domainName.replace(/order\./, "");
      domainName = domainName.replace(/espanol\./, "");

      return domainName;
    }
    else {
      return url;
    }
  };

  this.extractCurrentDomain = function() {
    if (domainName === null) {
      domainName = me.extractDomain(document.location.href);
    }

    return domainName;
  };

  this.getSubdomain = function() {
    var baseDomain = me.extractCurrentDomain();
    return document.location.hostname.replace(baseDomain, "");
  };

  //Function to convert text cart values to numbers for comparison
  this.convertToNumber = function(currency) {
    currency = currency.replace(/\.$|[^0-9\.,]+/g, "").replace(/(^(,|\.))|((,|\.)$)/g, "");

    // first detect if comma is used as separator or dot is used as separator
    var indexOfComma = currency.lastIndexOf(",");
    var indexOfPoint = currency.lastIndexOf(".");

    // if comma and point both are present then last one is used as decimal place while the one that occurred
    // first is separator
    if (indexOfComma != -1 && indexOfPoint != -1) {
      if (indexOfComma > indexOfPoint) {
        currency = currency.replace(/,/g, "-");
        currency = currency.replace(/\./g, ",");
        currency = currency.replace(/-/g, ".");
      }
    }
    else if (indexOfPoint != -1) {
      if (currency.length - indexOfPoint - 1 > 2) {
        currency = currency.replace(/\./g, ",");
      }
    }
    else if (indexOfComma != -1) {
      if (currency.length - indexOfComma - 1 <= 2) {
        currency = currency.replace(/,/g, ".");
      }
    }

    // remove commas
    currency = currency.replace(/,+/g, "");

    var number = Number.NaN;
    if (currency !== "") {
      number = Number(currency);
    }

    return number;
  };

  this.fireHtmlEvent = function(element, eventName, canBubble) {
    if (typeof canBubble == "undefined") {
      canBubble = false;
    }

    var evt = document.createEvent("HTMLEvents");
    evt.initEvent(eventName, canBubble, true);
    element.dispatchEvent(evt);
  };

  this.fireGeneralEvent = function(element, eventName, canBubble) {
    if (typeof canBubble == "undefined") {
      canBubble = true;
    }

    var evt = document.createEvent("Events");
    evt.initEvent(eventName, canBubble, true);
    element.dispatchEvent(evt);
  };

  this.fireKeyboardEvent = function(element, eventName, key) {
    /*var event = document.createEvent("KeyboardEvent");
    if (event.initKeyEvent) {
      event.initKeyEvent(eventName, true, true, window, 0, 0, 0, 0, 0, key);
    }
    else {
      event.initKeyboardEvent(eventName, true, true, window, 0, 0, 0, 0, 0, key);
    }
    element.dispatchEvent(event);*/

    var event = new KeyboardEvent(eventName, {key: key, bubbles: true});
    element.dispatchEvent(event);
  };

  this.getElemId = function(elem) {
    var elemId = elem.id;

    if (!elemId) {
      elemId = "z" + this.getRandomNum();
      elem.id = elemId;
    }

    return elem.id;
  };

  // returns a random number within the provided limit
  this.getRandomNum = function(lowerLimit, upperLimit) {
    if (typeof lowerLimit == "undefined") {
      lowerLimit = 0;
    }
    if (typeof upperLimit == "undefined") {
      upperLimit = 10000000000;
    }

    return Math.round(Math.random() * upperLimit) + lowerLimit;
  };

  function onDOMModification($elem, matchFunc, callback) {
    var fired = false;
    var observer = new MutationObserver(function (mutations) {
      // just to make sure the event fires only once
      if (fired) {
        return;
      }

      $elem.each(function() {
        // just to make sure the event fires only once
        if (fired) {
          return;
        }

        var $this = $(this);
        if (matchFunc(this)) {
          fired = true;
          observer.disconnect();
          callback(mutations);
        }
      });
    });

    observer.observe(document.body, { attributes: true, subtree: true, childList: true, attributeFilter: ["style", "class"], characterData: true });

    return observer;
  }

  // fires callback only once
  this.onShow = function($elem, callback, checkImmediately, checkText) {
    // if element is already visible, fire callback immediately
    if (checkImmediately && $elem.is(":visible") && $elem.css("visibility") != "hidden" && $elem[0].offsetHeight > 0 && $elem[0].offsetWidth > 0 && (!checkText || $elem.text().length > 0)) {
      callback();
      return;
    }

    return onDOMModification($elem, function (element) {
      var $element = $(element);
      return $element.is(":visible") && $element.css("visibility") != "hidden" && element.offsetHeight > 0 && element.offsetWidth > 0 && (!checkText || $element.text().length > 0);
    }, callback);
  };

  // fires callback only once
  this.onHide = function($elem, callback) {
    return onDOMModification($elem, function (element) {
      var $element = $(element);
      return !$element.is(":visible") || $element.css("visibility") == "hidden" || element.offsetHeight == 0 || element.offsetWidth == 0;
    }, callback);
  };

  // simulates click on an element
  this.simulateClick = function(element)
  {
    element.focus();

    // click function is not preset on all element i.e. anchor tag
    if (element.click)
    {
      element.click();
    }
    else
    {
      var evt = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window
      });

      var canceled = !element.dispatchEvent(evt);
      if(canceled) {
        // A handler called preventDefault
        console.warn("simulateClick: a handler called preventDefault");
      }
    }
  };

  // simulates click on an element
  this.simulateClickInSiteContext = function(element)
  {
    var elemId = utils.getElemId(element);

    var script = "var element = document.getElementById('" + elemId + "');" +
    "var evt = new MouseEvent(\"click\", {" +
    "bubbles: true," +
    "cancelable: true," +
    "view: window" +
    "});" +
    "var canceled = !element.dispatchEvent(evt);" +
    "if(canceled) {" +
    "console.warn(\"simulateClick: a handler called preventDefault\");" +
    "}";

    var $script = $("<script>").text(script);
    $("body").append($script);
  };

  // logs catc2 messages to console
  this.log = function(message) {
    Logger.log('CouponFollow > ' + message);
  };

  // clones a javascript object
  this.clone = function(obj) {
    return JSON.parse(JSON.stringify(obj));
  };

  // extracts root domain from complete domain, i.e. passed www.example.com, it'll return example.com
  this.getRootDomain = function(domain) {
    var domainParts = domain.split(".");
    return domainParts[domainParts.length - 2] + "." + domainParts[domainParts.length - 1];
  };

  this.contains = function(a, obj) {
    var i = a.length;
    while (i--) {
      if (a[i] === obj) {
        return true;
      }
    }
    return false;
  };

  this.simulateTextInput = function($elem, text) {
    $elem.val(text);

    var elem = $elem[0];

    // some sites actually listen for change,keydown,keyup,keypress events to change the coupon code internally (for example
    // rei.com, colehaan.com), so we need to fire these events after changing text
    utils.fireKeyboardEvent(elem, "keydown", 97);
    utils.fireKeyboardEvent(elem, "keypress", 97);
    utils.fireKeyboardEvent(elem, "keyup", 97);
    utils.fireGeneralEvent(elem, "input", true);
    utils.fireHtmlEvent(elem, "change", true);
  };

  this.onClassChange = function($elem, callback) {
    var observer = new MutationObserver(callback);

    observer.observe($elem[0], { attributes: true, attributeFilter: ["class"] });

    return observer;
  };

  this.openPopup = function(url, options) {
    var optionsStr = "'toolbar=0, location=0, directories=0, status=0, menubar=0, scrollbars=0, resizable=0";

    if (options) {
      if (options.centerAlign) {
        options.left = (screen.width / 2) - (options.width / 2);
        options.top = (screen.height / 2) - (options.height / 2) - 40;
      }

      if (typeof options.width !== "undefined") {
        optionsStr += ", width=" + options.width;
      }
      if (typeof options.height !== "undefined") {
        optionsStr += ", height=" + options.height;
      }
      if (typeof options.top !== "undefined") {
        optionsStr += ", top=" + options.top;
      }
      if (typeof options.left !== "undefined") {
        optionsStr += ", left=" + options.left;
      }
    }

    window.open(url, options.windowName, optionsStr);
  };

  this.parseQueryParams = function(querySeparator) {
    if (!querySeparator) {
      querySeparator = "?";
    }

    var queryObj = {};
    var query = location.href.split(querySeparator)[1];
    if (query) {
      var params = query.split("&");
      for (var i=0, param; param=params[i]; i++) {
        var p = param.split("=");
        queryObj[p[0]] = decodeURIComponent(p[1]);
      }
    }

    return queryObj;
  };

  this.containsAKeyword = function (string, keywords) {
    string = string.toLowerCase();
    for (var i = 0; i < keywords.length; i++) {
      if (string.indexOf(keywords[i].toLowerCase()) !== -1) {
        return keywords[i];
      }
    }

    return false;
  };

  this.waitUntilVisible = function(selector, callback) {
    var alreadyFired = false;

    var stopListener = function() {
      document.unbindArrive(selector, arriveListener);

      for (var i = 0; i < observers.length; i++) {
        observer = observers[i];
        observer.disconnect();
      }

      observers = [];
    };

    var arriveListener = function() {
      Logger.log("Arrive fired for selector " + selector + " ...");

      var $elem = $(this);

      // if element is not visible, wait until it becomes visible
      var observer = utils.onShow($elem, function () {
        // make sure the callback is called only once
        if (!alreadyFired) {
          Logger.log("Element (selector: " + selector + ") became visible...");

          stopListener();
          callback($elem[0]);

          alreadyFired = true;
        }
      }, true);

      if (observer) {
        observers.push(observer);
      }
    };

    var observers = [],
      observer;

    if (selector && selector.length > 0) {
      document.arrive(selector, { existing: true, fireOnAttributesModification: true }, arriveListener);
    }
    else {
      // schedule in next event loop to make it behave asynchronously
      setTimeout(callback, 1);
    }

    return { stopListener: stopListener };
  };

  this.preLoad = function(url) {
    var image = new Image();
    image.src = url;
  };

  this.escapeHtml = function(str) {
    var replacements = { "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" };
    return str.replace(/[&"<>]/g, function (m){ return replacements[m]});
  };

  window.Logger = {};
  
  if (Config && Config.dumpLogs == false) {
    Logger.log = function() {};
  }
  else {
    Logger.log = console.log.bind(window.console);
  }

})(this, undefined);


// need to export in case of firefox so it can be accessed in other files
if (typeof exports !== "undefined") {
  exports.utils = utils;
}
