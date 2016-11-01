/*
 * Coupons at Checkout 2.0 - Chrome Browser Extension
 * Copyright (c) 2012, 2013, 2014 CouponFollow, LLC.  All rights reserved.  Patent Pending.
 * Copying this source code in any manner is strictly prohibited.
 */

"use strict";

var Steps = {
  FETCH_SITE_INFO: 1,
  REMOVE_CODE: 2,
  APPLY_CODE: 3,
  CHECK_COUPON_RESULT: 4,
  APPLY_BEST_CODE: 5,
  AUTO_APPLY_COMPLETED: 6
};

var catc2 = new (function(window, undefined) {

  var FALLBACK_TIMEOUT = 4500,
    SELECTORS_CACHE_EXPIRE_TIME = 10, // 10 minutes
    CODES_CACHE_EXPIRE_TIME = 2, // 2 minutes
    DEFAULT_WAIT_AFTER_APPLY_TIME = 300,
    ORIGINAL_CART_VALUE_CALCULATION_DELAY = 1000;

  var defaults = {
    lowestCartValue: "",
    lowestCartCode: "",
    lowestCartCodeId: 0,
    originalCartValue: "",
    currentCartValue: "",
    previousCartValue: "",
    currentCode: "",
    currentCodeId: 0,
    iteration: 0,
    bestIteration: -1,
    codes: [],
    savingsAmount: 0,
    maxSavings: 0,
    hasAllRequiredElements: false,
    coupon_input_box: "",
    coupon_apply_button: "",
    coupon_remove_button: "",
    order_subtotal: "",
    order_total: "",
    isAjaxCart: false,
    isEnabled: true,
    isFinalProcess: false,
    timeStart: "",
    timeEnd: "",
    tabChanged: false,
    results: {
      DomainName: null,
      TimeTaken: "",
      NumTried: 0,
      OriginalCartValue: 0,
      FinalCartValue: 0,
      FinalSavingsAmount: 0,
      BestCouponCodeId: 0,
      CodeResult: []
    },
    nextStep: Steps.FETCH_SITE_INFO
  };

  var url = document.location.href,
    domainName = utils.extractCurrentDomain(),
    context = null,
    codeInfoReceived = false,
    selectorsInfoReceived = false,
    oldContext = null,
    me = this,
    hookResult,
    closeErrorMessageHandler = null;

  this.settings = null;
  this.autoApplyRunning = false;
  this.AACartKeywords = ["billing","payment","summary"];

  this.init = function() {

    // if there are no hooks for the site, initialize it as empty
    // hooks are used for site specific handling
    if (typeof window.Hooks === "undefined") {
      window.Hooks = {};
    }

    // get current user settings from background page
    BS.sendMessage({method: "getInitData", domain: domainName}, function (initData) {
      me.settings = initData.settings;

      if (initData.cartKeywords) {
        utils.cartKeywords = initData.cartKeywords;
      }

      if (initData.inputKeywords) {
        auto_reveal.inputKeywords = initData.inputKeywords;
      }

      if (initData.AACartKeywords) {
        me.AACartKeywords = initData.AACartKeywords;
      }

      // set CATC-UserId header as a global header so it's sent in all ajax requests
      utils.headers = {
        "CATC-UserId": me.settings.userId,
        "CATC-Version": me.settings.extensionVersion
      };

      utils.headers["CATC-Env"] = Config.environment;

      $.ajaxSetup({
        headers: utils.headers
      });

      // Page may refresh during auto-apply process for non-ajax sites. We preserve auto-apply state in
      // background page. We check current state from background page on page load and resume
      // auto-apply process if it's running
      if (!initData.context) {
        initializeFreshState();
      }
      else {
        // auto-apply is already in process, resume it
        resumeFromLastState(initData.context);
      }
    });
  };

  // checks if auto-apply can run on current page and gets/initializes data accordingly
  function initializeFreshState()
  {
    // check if the site is in the list of supported sites
    BS.sendMessage({ method: "isSiteSupported", domain: domainName }, function(siteSupported) {
      if (siteSupported) {
        // initialize with default values
        resetContext();

        isCart(function (isCart) {
          if (isCart) {
            // start listening for messages to start/stop auto apply and etc
            BS.onMessage(onMessageReceived);

            // trim dot from start of domain
            if (domainName.charAt(0) === '.')
              domainName = domainName.slice(1);

            BS.sendMessage({method: "isAutoApplyDisabledForTab", domain: domainName}, function (isDisabled) {
              if (!isDisabled) {
                // auto-apply is not running for the site, fetch site info (codes/selectors) and show "Find Savings" dialog
                fetchSiteInfo_internal(function () {
                  if (context.is_enabled) {
                    $(function () {
                      //if wait_after_load > 0, ensure that we check for selectors only after that time has passed
                      setTimeout(checkHasRequiredApplyElementsAfterLoad, context.wait_after_load);
                    });
                  }
                  else {
                    Logger.log("Auto-apply disabled for the site.");
                  }

                  // initialize auto-reveal once we have received selectors info as auto-reveal uses auto-apply input
                  // selector if it's available. See issue #233
                  auto_reveal.startAutoReveal(isCart);
                });
              }
              else {
                auto_reveal.startAutoReveal();
              }
            });
          }
          else {
            auto_reveal.startAutoReveal();
          }
        });
      }
      else {
        auto_reveal.startAutoReveal();
      }
    });
  }

  // Shows "Find Savings" dialog, displayed on pages where auto-apply can be started
  function showCat2cOverlay()
  {
    if (me.settings.showAutoApplyBox != "Yes") {
      return;
    }

    var iframeUrl = BS.getIframeUrl("resources/savingsguard-notify.html");
    iframeUrl += iframeUrl.indexOf("#") == -1 ? "#" : "&";
    iframeUrl += "domainName=" + encodeURIComponent(domainName);

    var $catc2Overlay = $("<div>", { "class": "catc2Overlay catc2", "id": "catc2Overlay" }).css("display", "none");
    var $iframe = $("<iframe>", {
      "id": "catc2overlay",
      "name": "savingsguard-notify",
      "src":  iframeUrl
    });

    $catc2Overlay.append($iframe);

    setTimeout(function() {
      $catc2Overlay.addClass("big-entrance");

      if (!$catc2Overlay.is(":visible") || $catc2Overlay.height() == 0 || $catc2Overlay.width() == 0) {
        reportIssue(url, domainName, "AA \"Find Savings\" dialog not visible.");
      }
    }, 400);

    $(document.documentElement).prepend($catc2Overlay);
  }

  // Closes "Find Savings" dialog
  function closeCatc2Overlay()
  {
    $("#catc2Overlay").remove();
  }

  // Loads state after page refresh and resumes auto-apply.
  // Called on page load
  function resumeFromLastState(state)
  {
    // start listening for messages to start/stop auto apply and etc
    BS.onMessage(onMessageReceived);

    // auto-apply is in process, restore state received from background page and continue with the auto-apply process
    context = state;

    initAutoApplyRunningState();

    auto_reveal.autoApplyInputSelector = context.coupon_input_box;

    // triggered auto-apply started/resumed web hook
    triggerHook(Hooks.onAutoApplyStarted);

    // Body element might not be loaded at the time, wait for the body element to load
    // and then append auto-apply processing dialog to body
    document.arrive("body", { existing: true }, onBodyLoaded);

    // wait for DOM to fully load before continuing with the auto-apply process
    $(function() {
      // some sites take some time to add all required elements to DOM even after 'ready' event is fired
      if (context.wait_after_load) {
        setTimeout(performNextStep, context.wait_after_load);
      }
      else {
        performNextStep();
      }
    });
  }

  // checks if all required elements exist on the page to start auto-apply
  function checkHasRequiredApplyElementsAfterLoad()
  {
    // we don't want to show "Find Savings" dialog if all required auto-apply elements are not present on the page
    // if context.check_is_visible selector is specified, wait until such an element becomes visible
    utils.waitUntilVisible(context.check_is_visible, function() {
      if (checkHasRequiredApplyElements()) {
        Logger.log("All required elements present");

        // show "Find Savings" dialog
        showCat2cOverlay();
      }
      else {
        console.error("Required elements missing!");
      }
    });
  }

  // displays auto-apply "Processing..." dialog on page load while auto-apply is running. Called immediately on page load.
  function onBodyLoaded() {
    Logger.log("Body elem injected...");
    showAutoApplyModal();
  }

  // listens for messages from background page and acts accordingly
  function onMessageReceived(request, sender, sendResponse)
  {
    if (request.method === 'beginAutoApplyStartedByUser') {
      // only start if auto apply is not already running
      if (!me.autoApplyRunning)
      {
        startAutoApply();
      }
    }
    else if (request.method === 'cancelAutoApply') {
      closeAutoApplyModal();
      cancelAutoApply();
    }
    else if (request.method == 'progressRequest') {
      sendProgressUpdate();
    }
    else if (request.method === "closeAutoApplyOverlay") {
      closeCatc2Overlay();
    }
  }

  // Sends progress update to "Processing..." dialog (iframe) while auto-apply is running
  function sendProgressUpdate()
  {
    if (me.autoApplyRunning) {
      var applyingCodeNum = context.iteration + 1;
      if (applyingCodeNum > context.codes.length) {
        if (context.bestIteration != -1) {
          msgToIframe({ method: "applyingBestCode" });
        }
        else {
          // if all codes are applied and there's no best code to apply next, show that it's still applying the last code
          msgToIframe({ method: "applyingNextCode", totalCodes: context.codes.length, current: applyingCodeNum - 1 });
        }
      }
      else {
        msgToIframe({ method: "applyingNextCode", totalCodes: context.codes.length, current: applyingCodeNum });
      }
    }
    else if (oldContext) {
      // either there's no valid coupon OR there's a valid coupon and it's applied successfully
      if (oldContext.bestIteration == -1 || oldContext.savingsAmount > 0) {
        sendAutoApplyCompletedUpdateToModal(oldContext.savingsAmount, oldContext.percentageSavings, oldContext.currency.currencyTextUsed, oldContext.success_image_url, oldContext.success_text, oldContext.request_text, oldContext.domain_name_id, oldContext.domain_name, oldContext.share_tweet);
      }
      else {
        // best code could not be applied successfully
        msgToIframe({ method: "errorOccurred", domainName: domainName });
      }
    }
    else
    {
      // best code could not be applied successfully
      msgToIframe({ method: "errorOccurred", domainName: domainName });
    }
  }

  // checks if required elements are present on page to auto-apply
  function checkHasRequiredApplyElements() {
    var hasRequiredElems = false;
    if (triggerHook(Hooks.hasRequiredApplyElements)) {
      hasRequiredElems = hookResult;
    }
    else {
      var $couponInputBox = me.getCouponInput(),
        $couponApplyBtn = $(context.coupon_apply_button),
        $couponRemoveBtn = $(context.coupon_remove_button),
        $orderSubTotal = $(context.order_subtotal),
        $orderTotal = $(context.order_total);

      if ((($couponInputBox.length && $couponApplyBtn.length) || ($couponRemoveBtn.length && $couponRemoveBtn.is(":visible"))) &&
        ($orderSubTotal.length || $orderTotal.length)) {
        hasRequiredElems = true;
      }
      else {
        // build error string to be reported to server
        var errorStr = "";
        if (!$couponInputBox.length) { errorStr += "not found: coupon input box\n"; }
        if (!$couponApplyBtn.length) { errorStr += "not found: coupon apply button\n"; }
        if (!$couponRemoveBtn.length) { errorStr += "not found: coupon remove button\n"; }
        if (!$orderSubTotal.length) { errorStr += "not found: order sub total\n"; }
        if (!$orderTotal.length) { errorStr += "not found: order total\n"; }

        Logger.log(errorStr);

        // only report issue if required elements are not found but input element is found using auto reveal method
        var $couponInput = auto_reveal.scrapeCouponInputUsingARHelpersAndAlgo();
        if ($couponInput && $couponInput.length > 0)
        {
          reportIssue(url, domainName, errorStr);
        }

        hasRequiredElems = false;
      }
    }

    return hasRequiredElems;
  }

  // starts auto-apply process
  function startAutoApply()
  {
    // for testing only, to see which elements gets injected when a coupon is applied or an error message is displayed
    /*document.arrive("*", function() {
     Logger.log(this);
     });*/

    $("#catc2overlay").remove();

    showAutoApplyModal();

    initAutoApplyRunningState();

    isCart(function() {
      if (isCart)
      {
        // we don't want to show "Find Savings" dialog if all required auto-apply elements are not present on the page
        if (checkHasRequiredApplyElements()) {
          context.timeStart = Date.now();

          // auto-reveal is disabled while auto-apply is running
          auto_reveal.hideAutoReveal();

          triggerHook(Hooks.onAutoApplyStarted);

          // if startAutoApply hook is defined for the site then performNextStep will be called by the hook
          if (!triggerHook(Hooks.startAutoApply, [context])) {
            performNextStep();
          }
        }
        else {
          errorOccurred("Required elements not present!", true);
        }
      }
      else
      {
        errorOccurred("Not a cart page!");
      }
    });
  }

  // called when auto-apply starts or resumed on page load
  function initAutoApplyRunningState() {
    me.autoApplyRunning = true;

    watchAndCloseDialogs();

    document.addEventListener("visibilitychange", onVisibilityChange, false);
    onVisibilityChange();
  }

  function onVisibilityChange() {
    if (document.visibilityState == "hidden") {
      context.tabChanged = true;
    }
  }

  function watchAndCloseDialogs() {
    // to close random dialogs that might appear during auto-apply process e.g. error dialog that might appear after applying
    // invalid coupon code, confirmation dialog that might appear on removing coupon code
    if (context.click_on_appearance) {
      closeErrorMessageHandler = utils.waitUntilVisible(context.click_on_appearance, function(elem) {
        if (!catc2.autoApplyRunning) {
          return;
        }

        setTimeout(function() {
          utils.simulateClick(elem);
          Logger.log("Auto-Apply: Close dialog clicked");

          setTimeout(watchAndCloseDialogs, 400);
        }, 200);
      });
    }
  }

  // resets auto-apply state, it's called when user cancels auto-apply process or if some error occurs
  function resetContext()
  {
    context = {};
    for (var key in defaults) {
      if (defaults.hasOwnProperty(key)){
        context[key] = defaults[key];
      }
    }

    context.results.DomainName = domainName;
  }

  // saves original cart values to compare it with discounted values, returns false in case of error
  function saveOriginalCartValues()
  {
    context.originalCartValue = getCurrentCartValue(null, false, true);
    context.lowestCartValue = context.originalCartValue;

    return context.originalCartValue !== false;
  }

  /*
   * Save pageContext before reload
   */
  function savePageContext()
  {
    BS.sendMessage({
      method: "savePageContext",
      domain: domainName,
      context: context
    });
  }

  /*
   * Resets page context so user can start over
   */
  function resetAutoApply()
  {
    codeInfoReceived = false;
    selectorsInfoReceived = false;
    me.autoApplyRunning = false;

    if (closeErrorMessageHandler) {
      closeErrorMessageHandler.stopListener();
    }

    // enable auto-reveal when auto-apply stops
    auto_reveal.startAutoReveal();

    triggerHook(Hooks.onAutoApplyStopped);
    resetContext();
    BS.sendMessage({
      method: "removePageContext",
      domain: domainName
    });
  }

  /*
   * Called when an error occurs while performing a step.
   */
  function errorOccurred(message, dontReport)
  {
    msgToIframe({ method: "errorOccurred", domainName: domainName });

    if (!dontReport) {
      reportIssue(url, domainName, "Error occurred during step " + context.nextStep + ". Message: " + message);
    }
    resetAutoApply();

    throw new Error("Error occurred during step " + context.nextStep + ". Message: " + message);
  }

  /*
   * Cancels currently running auto apply process
   */
  function cancelAutoApply()
  {
    if (me.autoApplyRunning) {
      sendCodeFeedback(true);
    }
    resetAutoApply();
  }

  /*
   * Performs next step based on the state stored in context variable.
   * This function is called whenever a step completes
   */
  function performNextStep()
  {
    if (!me.autoApplyRunning) {
      console.warn("Execution stopped. autoApplyRunning is false.");
      return;
    }

    switch (context.nextStep)
    {
      case Steps.FETCH_SITE_INFO:
        fetchSiteInfo();
        break;
      case Steps.REMOVE_CODE:
        removeCode();
        break;
      case Steps.APPLY_CODE:
        applyCode();
        break;
      case Steps.CHECK_COUPON_RESULT:
        checkCouponResult(1);
        break;
      case Steps.APPLY_BEST_CODE:
        applyBestCode();
        break;
      case Steps.AUTO_APPLY_COMPLETED:
        me.autoApplyCompleted();
        break;
      default:
        console.error("Invalid step!");
    }
  }

  /*
   * fetches site info (codes/selectors) and proceeds to next step
   * if site info is already present it will simply proceed to next step
   */
  function fetchSiteInfo() {
    fetchSiteInfo_internal(function() {

      if (context.is_enabled)
      {
        // auto-apply is enabled for the site, show auto-applying modal and continue the process
        if (context.is_catc_enabled)
        {
          BS.sendMessage({ method: "backgroundLinkOpen", url: Config.domain + "site/go/" + context.domain_name_id });
        }

        context.nextStep = Steps.REMOVE_CODE;
        performNextStep();
      }
      else
      {
        // auto-apply is disabled for the site, stop auto-apply and do not proceed to next step
        me.autoApplyRunning = false;
        Logger.log("Auto-apply disabled for the site.");

        // enable auto-reveal when auto-apply stops
        auto_reveal.startAutoReveal();
      }
    });
  }

  /*
   * fetches site info (codes/selectors) and calls the callback function
   * if site info is already present it will immediately call the callback function
   */
  function fetchSiteInfo_internal(callback) {

    // if site info has already been received, immediately call the callback function
    if (codeInfoReceived && selectorsInfoReceived) {
      if (callback) {
        callback();
      }
      return;
    }

    fetchCodes(function() {
      // call callback function if both, codes and selectors, has been fetched
      if (callback && selectorsInfoReceived) {
        callback();
      }
    });

    fetchSelectorsInfo(function() {
      // call callback function if both, codes and selectors, has been fetched
      if (callback && codeInfoReceived) {
        callback();
      }
    });
  }

  /*
   * fetches selectors info and calls the callback function
   * if selectors info is already present it will immediately call the callback function
   */
  function fetchSelectorsInfo(callback) {
    // fetch selectors if not already received
    if (!selectorsInfoReceived) {
      //If it is a cart page, get the selectors required for auto-apply and set them to our global variables
      Logger.log('Attempting to get selectors...');
      utils.remoteGetWithCache("selectors." + domainName, SELECTORS_CACHE_EXPIRE_TIME, Config.apiBase + "/getSelectors?id=" + domainName, function (selectors, statusCode) {

        if (statusCode != 200) {
          errorOccurred("Could not fetch selectors!");
          return;
        }

        selectorsInfoReceived = true;

        var selectorIndexToApply = null;

        // there could be multiple selector sets for a given site if the site contains two or more different checkout pages
        // figure out which one to apply on current page
        for (var i = 0; i < selectors.length; i++) {
          var includedUrlKeywords = selectors[i].IncludedUrlKeywords;

          if (typeof includedUrlKeywords === "undefined" || includedUrlKeywords === null) {
            // default selectors
            selectorIndexToApply = i;
          }
          else {
            if (utils.containsAKeyword(url, includedUrlKeywords.split(","))) {
              selectorIndexToApply = i;
              break;
            }
          }
        }

        if (selectorIndexToApply !== null) {
          context.domain_name_id = selectors[selectorIndexToApply].DomainNameId;
          context.domain_name = selectors[selectorIndexToApply].DomainName;
          context.coupon_input_box = selectors[selectorIndexToApply].CouponInputBox;
          context.coupon_apply_button = selectors[selectorIndexToApply].CouponApplyButton;
          context.coupon_remove_button = selectors[selectorIndexToApply].CouponRemoveButton;
          context.order_subtotal = selectors[selectorIndexToApply].OrderSubtotal;
          context.order_total = selectors[selectorIndexToApply].OrderTotal;
          context.isAjaxCart = selectors[selectorIndexToApply].IsAjax;
          context.coupon_area = selectors[selectorIndexToApply].CouponArea ? selectors[selectorIndexToApply].CouponArea : "";
          context.coupon_error_message = selectors[selectorIndexToApply].CouponErrorMessage ? selectors[selectorIndexToApply].CouponErrorMessage : "";
          context.wait_before_applying = selectors[selectorIndexToApply].WaitBeforeApplying;
          context.wait_after_applying = selectors[selectorIndexToApply].WaitAfterApplying;
          context.wait_after_load = selectors[selectorIndexToApply].WaitAfterLoad ? selectors[selectorIndexToApply].WaitAfterLoad : 200;
          context.close_error_message = selectors[selectorIndexToApply].CloseErrorMessage;
          context.click_on_appearance = selectors[selectorIndexToApply].ClickOnAppearance;
          context.check_is_visible = selectors[selectorIndexToApply].CheckIsVisible;
          context.is_enabled = selectors[selectorIndexToApply].IsEnabled;
          context.is_catc_enabled = selectors[selectorIndexToApply].IsCatcEnabled;
          context.empty_error_before_applying = selectors[selectorIndexToApply].EmptyError;
          context.hide_error_before_applying = selectors[selectorIndexToApply].HideError;
          context.click_before_start = selectors[selectorIndexToApply].ClickBeforeStart;
          context.included_url_keywords = selectors[selectorIndexToApply].IncludedUrlKeywords ? selectors[selectorIndexToApply].IncludedUrlKeywords : "";
          context.success_text = selectors[selectorIndexToApply].SuccessText;
          context.success_image_url = selectors[selectorIndexToApply].SuccessImageUrl;
          context.share_tweet = selectors[selectorIndexToApply].ShareTweet;
          context.request_text = selectors[selectorIndexToApply].RequestTweet;
          context.max_try_timeout = (selectors[selectorIndexToApply].MaxTryTimeout === null || selectors[selectorIndexToApply].MaxTryTimeout === undefined ) ?
            FALLBACK_TIMEOUT : selectors[selectorIndexToApply].MaxTryTimeout;

          context.results.DomainName = context.domain_name;
          context.results.DomainNameId = context.domain_name_id;

          auto_reveal.autoApplyInputSelector = context.coupon_input_box;
        }

        if (callback) {
          callback();
        }
      });
    }
    else if (callback) {
      callback();
    }
  }

  /*
   * fetches codes info and calls the callback function
   * if codes info is already present it will immediately call the callback function
   */
  function fetchCodes(callback) {
    // fetch codes if not already received
    if (!codeInfoReceived) {
      Logger.log('Attempting to get codes...');
      utils.remoteGetWithCache("codes." + domainName, CODES_CACHE_EXPIRE_TIME, Config.apiBase + "/getCodes?id=" + domainName, function(codesObj, statusCode) {
        if (statusCode != 200) {
          errorOccurred("Could not fetch codes!");
          return;
        }

        codeInfoReceived = true;

        context.codes = codesObj;

        // call callback function if both, codes and selectors, has been fetched
        if (callback) {
          callback();
        }
      });
    }
    else if (callback) {
      callback();
    }
  }

  // Removes the currently applied coupon
  // NOTE: This will not be used in cases where there is no coupon_remove_button selector provided
  function removeCode() {
    showAutoApplyModal(); // for non ajax sites
    sendProgressUpdate();

    if (context.iteration < context.codes.length)
    {
      context.nextStep = Steps.APPLY_CODE;
    }
    else
    {
      // this was the last code, apply the best code next
      context.nextStep = Steps.APPLY_BEST_CODE;
    }

    var $removeButton,
      visible,
      fallbackTimer;

    // Always check if coupon remove button is found
    if (context.coupon_remove_button && context.coupon_remove_button.length && ($removeButton = $(context.coupon_remove_button)).length
      && ((visible = $removeButton.is(':visible')) ||
        // check if there's any visible element in its child
      ($(context.coupon_remove_button + " :visible").length > 0 || domainName == "victoriassecret.com"))) { // on victoriassecret.com, the remove button might not be visible but still functional
      savePageContext();

      if (context.isAjaxCart)
      {
        // page won't refresh in case of ajax cart, so watch for changes in DOM to see when ajax request completes
        // and call performNextStep(); after that
        if (context.coupon_area)  // some hybrid may don't have coupon_area selector
        {
          var alreadyFired = false,
            observer = null;

          document.leave(context.coupon_area, function() {
            // to prevent arrive from firing multiple times
            if (!alreadyFired) {
              alreadyFired = true;

              if (fallbackTimer) {
                clearTimeout(fallbackTimer);
              }

              Logger.log("Leave fired...");

              // code has been applied, remove listeners
              document.unbindLeave(context.coupon_area);
              if (observer) {
                observer.disconnect();
              }

              if (context.originalCartValue == "") {
                // add a delay of about 1 sec before noting original cart value after removing initial code to make sure
                // the cart value has been updated. Refer to issue #159
                setTimeout(performNextStep, ORIGINAL_CART_VALUE_CALCULATION_DELAY);
              }
              else {
                performNextStep();
              }
            }
          });

          // if element already exist in DOM, watch when it hides
          var $coupon_area = $(context.coupon_area);

          if ($coupon_area.length > 0) {
            observer = utils.onHide($coupon_area, function() {
              if (!alreadyFired) {
                Logger.log("Coupon area got hidden...");
                alreadyFired = true;

                if (fallbackTimer)
                {
                  clearTimeout(fallbackTimer);
                }

                // code has been applied, remove listeners
                document.unbindLeave(context.coupon_area);
                if (observer) {
                  observer.disconnect();
                }

                if (context.originalCartValue == "") {
                  // add a delay of about 1 sec before noting original cart value after removing initial code to make sure
                  // the cart value has been updated. Refer to issue #159
                  setTimeout(performNextStep, ORIGINAL_CART_VALUE_CALCULATION_DELAY);
                }
                else {
                  performNextStep();
                }
              }
            });
          }
          else
          {
            Logger.log("Coupon area and error msg element not found.");
          }
        }
      }

      // fallback to timeout mechanism if error element or coupon area element does not appear within
      // specified time or page does not refresh then report the issue to server
      fallbackTimer = setTimeout(function () {
        if (!alreadyFired)
        {
          // code has been applied, remove listeners
          document.unbindLeave(context.coupon_area);
          if (observer) {
            observer.disconnect();
          }

          // if user has cancelled auto-apply, go no further
          if (!me.autoApplyRunning) {
            console.warn("Execution stopped. autoApplyRunning is false.");
            return;
          }

          alreadyFired = true;
          reportIssue(url, domainName, "Timeout occurred after removing code! Coupn Area Selector: " + context.coupon_remove_button);

          performNextStep();
        }
      }, context.max_try_timeout);


      triggerHook(Hooks.beforeRemoveCode);

      Logger.log('Remove button found: ' + context.coupon_remove_button + ", simulating click");
      utils.simulateClick($removeButton[0]);
    }
    else
    {
      // there's no remove button for the site, or previous coupon code does not need to be removed before applying
      // next code, continue to next step
      performNextStep();
    }
  }

  // Applies the next coupon in the array.
  function applyCode() {
    var previousCode = null;
    if (context.iteration > 0) {
      previousCode = context.codes[context.iteration].Code;
    }

    context.cartValueBeforeApplyingCoupon = getCurrentCartValue(previousCode, false);

    // if this is the first run then save the original cart values
    if (context.originalCartValue == "") {
      if (!saveOriginalCartValues()) {
        return false;
      }
    }

    //Populate coupon_input_box with current coupon code
    Logger.log('Setting code to i:' + context.iteration);
    var currentCode = context.codes[context.iteration].Code;

    context.nextStep = Steps.CHECK_COUPON_RESULT;
    // save page context in background page as for non-ajax sites the page will be refreshed after applying code
    savePageContext();
    applyCode_internal(currentCode);
  }

  // Applies the given code, waits before applying if required
  function applyCode_internal(code) {
    if (context.wait_before_applying) {
      setTimeout(applyCode_internal_1, context.wait_before_applying, code);
    }
    else {
      applyCode_internal_1(code)
    }
  }

  // Applies the given code
  function applyCode_internal_1(code)
  {
    // if user has cancelled auto-apply, go no further
    if (!me.autoApplyRunning) {
      console.warn("Execution stopped. autoApplyRunning is false.");
      return;
    }

    if (triggerHook(Hooks.applyCode, [code])) {
      return;
    }

    if (context.click_before_start) {
      var $elem = $(context.click_before_start);
      if ($elem.length > 0) {
        utils.simulateClick($elem[0]);
      }
    }

    //Populate coupon_input_box with current coupon code
    var $couponInputBox = me.getCouponInput();

    if ($couponInputBox.length == 0) {
      if (!triggerHook(Hooks.inputElementNotFound)) {
        errorOccurred("Coupon input element not found! Selector = " + context.coupon_input_box);
      }
      return;
    }

    utils.simulateTextInput($couponInputBox, code);

    // wait for 100 ms after entering coupon code in input box because some sites take some time to detect the change
    // and enable apply button
    setTimeout(function () {

      // if user has cancelled auto-apply, go no further
      if (!me.autoApplyRunning) {
        console.warn("Execution stopped. autoApplyRunning is false.");
        return;
      }

      function afterCodeApplied(validCoupon) {
        if (!alreadyFired)
        {
          alreadyFired = true;

          context.isValidCouponCode = validCoupon;

          removeListeners();

          onCodeApplied();
        }
      }

      // removes all observers and unbind listeners which are looking for code apply.
      // Called after code gets applied or invalid code message appears
      function removeListeners() {
        if (fallbackTimer)
        {
          clearTimeout(fallbackTimer);
        }

        document.unbindArrive(context.coupon_area);
        document.unbindArrive(context.coupon_error_message);

        // code has been applied, remove error listener
        if (observer1) {
          observer1.disconnect();
        }
        if (observer2) {
          observer2.disconnect();
        }
      }

      Logger.log('Applying code: ' + code);
      var $applyButton = $(context.coupon_apply_button);

      if ($applyButton.length > 0) {
        Logger.log("Found apply button using default method.");
      } else {
        errorOccurred("Apply button not found! Selector = " + context.coupon_apply_button);
        return;
      }

      var fallbackTimer = null;

      if (context.isAjaxCart)
      {
        // page won't refresh in case of ajax cart, so watch for changes in DOM to see when ajax request completes
        // and call performNextStep() after that

        var observer1 = null,
          observer2 = null,
          alreadyFired = false;

        if (context.coupon_area.length > 0)
        {
          if (!triggerHook(Hooks.skipCouponSuccessWatch))
          {
            // watch for creation of coupon added area
            document.arrive(context.coupon_area, function() {
              Logger.log("Coupon area arrive fired...");
              afterCodeApplied(true);
            });
          }
        }

        if (context.coupon_error_message.length > 0)
        {
          // watch for creation of coupon error message area
          document.arrive(context.coupon_error_message, function() {
            if (!triggerHook(Hooks.triggerCouponErrorMessage, [$(this)]) || hookResult == true) {
              Logger.log("Coupon error message arrive fired...");
              afterCodeApplied(false);
            }
          });
        }

        // if error element already exist in DOM, watch when it becomes visible
        $errorElement = $(context.coupon_error_message);

        if ($errorElement.length > 0) {
          observer1 = utils.onShow($errorElement, function() {
            Logger.log("Error msg element visibility changed...");
            afterCodeApplied(false);
          }, false, true);
        }
        else
        {
          Logger.log("Error msg element not found.");
        }

        // if coupon area already exist in DOM, watch when it becomes visible
        var $couponArea = $(context.coupon_area);

        if ($couponArea.length > 0 && !$couponArea.is(":visible")) {
          if (!triggerHook(Hooks.skipCouponSuccessWatch)) {
            observer2 = utils.onShow($couponArea, function () {
              Logger.log("Coupon area element visibility changed...");
              afterCodeApplied(true);
            });
          }
        }
        else
        {
          Logger.log("Coupon area element not found.");
        }

        triggerHook(Hooks.onApplyButtonClicked, [function() {
          Logger.log("DOM change detected through custom hook");
          afterCodeApplied();
        }]);
      }

      // for some sites we need to hide error element before applying next code so we can detect change when next code
      // fails
      if (context.hide_error_before_applying) {

        var $errorElement = $(context.coupon_error_message);
        if ($errorElement.length > 0) {
          // some sites use visibility property to hide while others use display property, we need to use the same
          // property which site uses to hide/display so that site can show the error on next invalid code try
          if ($errorElement[0].style.visibility) {
            $errorElement.css('visibility', 'hidden');
          }
          else {
            $errorElement.css("display", "none")
          }
        }
      }

      // some sites just set error message to empty string to hide error element
      if (context.empty_error_before_applying) {
        $(context.coupon_error_message).html("");
      }

      utils.simulateClick($applyButton[0]);


      // fallback to timeout mechanism if error element or coupon area element does not appear within
      // specified time or page does not refresh (for non-ajax sites) then report the issue to server
      fallbackTimer = setTimeout(function () {
        if (!alreadyFired)
        {
          alreadyFired = true;

          removeListeners();

          if (!me.autoApplyRunning) {
            console.warn("Execution stopped. autoApplyRunning is false.");
            return;
          }

          if (context.isAjaxCart) {
            reportIssue(url, domainName, "Timeout occurred after applying code! Coupon Area Selector: " + context.coupon_area + " Error Selector: " + context.coupon_error_message + "  Coupon Code: " + code
              + "  $couponAreaAndError.length = " + $errorElement.length);
          }
          else {
            reportIssue(url, domainName, "Timeout occurred after applying code! Coupon Area Selector: " + context.coupon_area + " Error Selector: " + context.coupon_error_message + "  Coupon Code: " + code);
          }

          onCodeApplied();
        }
      }, context.max_try_timeout);
    }, 300);
  }

  // called after code has been applied successfully or error message has been appeared after applying code
  function onCodeApplied()
  {
    if (triggerHook(Hooks.onCodeApplied)) {
      return;
    }
    // we need to close error message explicitly for some sites as they don't close error message automatically before
    // applying next code
    if (context.close_error_message) {
      var $closeElem = $(context.close_error_message);
      if ($closeElem.length > 0) {
        utils.simulateClick($closeElem[0]);
      }
    }

    // continue to next step
    var waitAfterApplying = context.wait_after_applying === null ? DEFAULT_WAIT_AFTER_APPLY_TIME : context.wait_after_applying;
    setTimeout(performNextStep, waitAfterApplying);
  }

  // Checks if coupon code is valid and calculate cart values to get the savings amount used to determine which code
  // to apply at the end. This is the next step after applying coupon code.
  function checkCouponResult(tries) {
    var currentCode = context.codes[context.iteration].Code,
      currentCodeId = context.codes[context.iteration].CouponCodeId,
      codeResult;

    if (triggerHook(Hooks.beforeCouponResultCheck, [context])) {
      if (!hookResult) {
        return;
      }
    }

    context.currentCartValue = getCurrentCartValue(currentCode);

    if (context.currentCartValue === false) {
      return;
    }

    // if coupon is valid but cart value isn't changed, wait for another 400ms and see if cart value changes
    if (context.isValidCouponCode && tries <= 1)
    {
      var cartValueToCompare = context.previousCartValue != "" ? context.previousCartValue : context.originalCartValue;
      if (cartValueToCompare == context.currentCartValue) {
        setTimeout(checkCouponResult, 400, tries + 1);
        return;
      }
    }

    // if the coupon is valid, add it to successful coupons array.
    // some sites does not allow removing coupons, so to avoid adding invalid coupons to successful coupons list we check
    // that price of previous iteration should be different from current iteration otherwise it mean that previous coupon
    // is still applied
    if (context.currentCartValue != context.cartValueBeforeApplyingCoupon && context.currentCartValue < context.originalCartValue) {
      codeResult = {};
      codeResult.Code = currentCode;
      codeResult.CouponCodeId = currentCodeId;
      codeResult.CartValue = context.currentCartValue;
      codeResult.OriginalCartValue = context.originalCartValue;
      context.results.CodeResult.push(codeResult);

      context.savingsAmount = (context.originalCartValue - context.currentCartValue).toFixed(2);

      Logger.log("%cSuccessful coupon: " + currentCode + ", Savings amount: " + context.savingsAmount, "font-weight: bold; color: green;");
    }

    //Set the lowest values if the new cart value is lower than the original value
    if (context.currentCartValue < context.lowestCartValue) {
      //Set values
      Logger.log('New lowest cart value found: ' + context.currentCartValue + ", Coupon Code: " + currentCode);

      context.lowestCartValue = context.currentCartValue; //Set to current cart value
      context.lowestCartCode = currentCode; //Set to current Code value
      context.lowestCartCodeId = currentCodeId; //Set to current Code identifier value
      context.bestIteration = context.iteration; //Set the best coupon iteration to this
      context.maxSavings = context.savingsAmount;
    }

    Logger.log("Original: " + context.originalCartValue + " Current:" + context.currentCartValue + " Previous:" + context.previousCartValue +  " Lowest:" + context.lowestCartValue + " (Max Savings: " + context.maxSavings + ")");
    Logger.log("-----------------------------------------------------------------------------------------------------");

    context.previousCartValue = context.currentCartValue;

    context.iteration++;
    context.nextStep = Steps.REMOVE_CODE;
    performNextStep();
  }

  function getCurrentCartValue(currentCode, autoApplyCompleted, dontUseHook)
  {
    var currentCartValue = false;

    if (dontUseHook || !triggerHook(Hooks.getCurrentCartValue, [context, currentCode, autoApplyCompleted])) {
      var $orderTotal,
        $orderSubTotal;

      //Set currentCartValue to order_total value, if it is not available, use order_subtotal
      if (context.order_total && ($orderTotal = $(context.order_total)).length) {
        currentCartValue = utils.convertToNumber($orderTotal.text());

        if (isNaN(currentCartValue)) {
          errorOccurred("Order total is NaN! Order Total Selector = " + context.order_total + ", Found elements length: " + $(context.order_total).length);
          return false;
        }
      } else if (context.order_subtotal && ($orderSubTotal = $(context.order_subtotal)).length) {
        currentCartValue = utils.convertToNumber($orderSubTotal.text());

        if (isNaN(currentCartValue)) {
          errorOccurred("Order subtotal is NaN! Order Subtotal Selector = " + context.order_subtotal + ", Found elements length: " + $(context.order_subtotal).length);
          return false;
        }
      }
      else {
        errorOccurred("Order total element not found! Selector = " + context.order_total + ", " + context.order_subtotal);
        return false;
      }
    }
    else {
      currentCartValue = hookResult;

      if (isNaN(currentCartValue)) {
        errorOccurred("Order subtotal is NaN! Used hook: Hooks.getCurrentCartValue");
        return false;
      }
    }

    return currentCartValue;
  }

  // called at the end of auto-apply process to apply the best code
  function applyBestCode()
  {
    context.nextStep = Steps.AUTO_APPLY_COMPLETED;

    if (context.success_image_url) {
      // pre-load image so it's cached
      utils.preLoad(context.success_image_url);
    }

    if (!Hooks.dontApplyBestCode) {
      if (context.bestIteration > -1)
      {
        Logger.log("Applying best code: " + context.lowestCartCode + " (" + context.lowestCartCodeId + ")");
        savePageContext();
        applyCode_internal(context.lowestCartCode);
      }
      else
      {
        Logger.log('No valid coupons found for this order.!');
        performNextStep();
      }
    }
    else {
      performNextStep();
    }
  }

  // called when auto-apply completes successfully
  me.autoApplyCompleted = function ()
  {
    if (triggerHook(Hooks.beforeCouponResultCheck, [context])) {
      if (!hookResult) {
        return;
      }
    }

    context.currentCartValue = getCurrentCartValue(null, true);

    if (context.currentCartValue === "" || isNaN(context.currentCartValue)) {
      errorOccurred("Incorrect final cart value. Final Cart Value = " + context.currentCartValue);
      return false;
    }

    context.savingsAmount = (context.originalCartValue - context.currentCartValue).toFixed(2); //Set the savings amount

    context.percentageSavings = ((1 - (context.currentCartValue / context.originalCartValue)) * 100).toFixed(2);
    context.currency = getCurrency();

    sendCodeFeedback();

    showAutoApplyModal(); // for non ajax sites

    // either there's no valid coupon OR there's a valid coupon and it's applied successfully
    if (context.bestIteration == -1 || context.savingsAmount > 0) {
      sendAutoApplyCompletedUpdateToModal(context.savingsAmount, context.percentageSavings, context.currency.currencyTextUsed, context.success_image_url, context.success_text, context.request_text, context.domain_name_id, context.domain_name, context.share_tweet);
    }
    else {
      // best code could not be applied successfully
      errorOccurred("Best code could not be applied successfully. Savings was 0 after applying best code.");
    }

    // we need to save context in old context because progress modal may request progress update after auto-apply is
    // completed and we have reset context
    oldContext = utils.clone(context);

    resetAutoApply();
  };

  function sendCodeFeedback(isCancelled) {
    var dStart = new Date(context.timeStart);
    var dEnd = new Date();
    Logger.log('Start: ' + dStart);
    Logger.log('End: ' + dEnd);

    var timeElapsed = dEnd.getTime() - dStart.getTime();
    context.results.TimeTaken = (timeElapsed/1000).toString();

    if (!context.currency) {
      context.currency = getCurrency();
    }

    //Added to send
    context.results.FinalCartValue = context.currentCartValue.toString();
    context.results.OriginalCartValue = context.originalCartValue.toString();
    context.results.FinalSavingsAmount = context.savingsAmount.toString();
    context.results.NumTried = (context.iteration).toString();
    context.results.BestCouponCodeId = context.lowestCartCodeId;
    context.results.CurrencyCode = context.currency.currencyCode;
    context.results.CurrencySymbol = context.currency.currencySymbol;
    context.results.IsCompleted = !isCancelled;
    context.results.TabChanged = context.tabChanged;

    //Sending results
    Logger.log('Sending results...');
    Logger.log(JSON.stringify(context.results)); //log results

    $.ajax({
      url: Config.apiBase + '/SendCodeFeedback',
      data: JSON.stringify(context.results),
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      success: function(result) {
        Logger.log('SUCCESS!  Codes reported.');
        //TODO: any necessary functions here to record success
        //reset();
      }
    });
  }

  function sendAutoApplyCompletedUpdateToModal(savings, percentageSavings, currency, successImgUrl, successText, requestText, domainNameId, domainName, shareTweet) {
    msgToIframe({ method: "autoApplyCompleted", savings: savings, currency: currency, percentageSavings: percentageSavings, successImageUrl: successImgUrl, successText: successText, requestText: requestText, domainName: domainName, domainNameId: domainNameId, shareTweet: shareTweet });
  }

  // shows a modal which shows progress of currently running auto-apply
  function showAutoApplyModal()
  {
    var $catc2Modal = $("#catc2Modal");
    if ($catc2Modal.length == 0) { //  if modal is not already present
      var $iframe = $("<iframe>", {
        "id": "catc2Modal",
        "class": "catc2",
        "name": "savingsguard-modal",
        "src": BS.getIframeUrl("resources/savingsguard-modal.html")
      });

      $(document.documentElement).prepend($iframe);

      if (!$iframe.is(":visible") || $iframe.height() == 0 || $iframe.width() == 0) {
        reportIssue(url, domainName, "AA progress modal not visible.");
      }
    }
  }

  // removes auto-apply progress modal
  function closeAutoApplyModal() {
    $("#catc2Modal").remove();
  }

  // sends message to auto-apply progress iframe through background page
  function msgToIframe(msg) {
    msg.for = "iframe";
    BS.sendMessage(msg);
  }

  // calls site specific hook function if defined
  // returns true if a hook is called, false otherwise
  // if the hook returns some value, the return value will be available in hookResult function
  function triggerHook(hookFunc, params) {
    if (hookFunc) {
      hookResult = hookFunc.apply(null, params);
      return true;
    }
    else {
      return false;
    }
  }

  // reports an issue to server
  function reportIssue(url, domain, message) {
    message += " - TabChanged = " + context.tabChanged;
    if (document.visibilityState == "hidden") {
      message += ". Page state is hidden.";
    }

    $.ajax({
      method: "POST",
      url: Config.apiBase + "/reportIssue",
      data: {url: url, domainName: domain, domainNameId: context.domain_name_id, message: message}
    });

    Logger.log("Issue Reported: \nDomain: " + domain + "\nUrl: " + url + "\nMessage: " + message);
  }

  function isCart(callback) {
    if (triggerHook(Hooks.isCart, [callback])) {
      return;
    }

    fetchSelectorsInfo(function () {
      // use site specific whitelist of cart keywords if provided otherwise use general cart keywords
      if (context.included_url_keywords) {
        // we have already checked that url includes one of the specified keywords
        callback(true);
      }
      else {
        // use general cart keywords
        callback(utils.isCart(me.AACartKeywords));
      }
    });
  }

  function getCurrency() {
    var orderTotalText = null,
      $orderTotal,
      currency = { currencyTextUsed: null, currencyCode: null, currencySymbol: null };

    if (context.order_total && ($orderTotal = $(context.order_total)).length) {
      orderTotalText = $orderTotal.text();
    } else if (context.order_subtotal && ($orderTotal = $(context.order_subtotal)).length) {
      orderTotalText = $orderTotal.text();
    }

    if (orderTotalText) {
      var currencyCode,
        curr;

      // in first loop check if text contains a currency code, if so then give preference to currency code
      // otherwise look for currency symbol in 2nd loop
      for (currencyCode in currencies) {
        curr = currencies[currencyCode];

        if (orderTotalText.indexOf(curr.code) !== -1) {
          currency = { currencyTextUsed: curr.code + " ", currencyCode: curr.code, currencySymbol: curr.symbol };
          break;
        }
      }

      // if currency code is not found then look for currency symbol
      if (currency.currencyCode == null) {
        for (currencyCode in currencies) {
          curr = currencies[currencyCode];

          if (orderTotalText.indexOf(curr.symbol) !== -1) {
            currency = { currencyTextUsed: curr.symbol, currencyCode: null, currencySymbol: curr.symbol };
            break;
          }
          else if (orderTotalText.indexOf(curr.symbol_native) !== -1) {
            currency = { currencyTextUsed: curr.symbol_native, currencyCode: null, currencySymbol: curr.symbol };
            break;
          }
        }
      }
    }

    // always use $ to display savings if currency code used is USD
    if (currency.currencyTextUsed == "USD") {
      currency.currencyTextUsed = "$";
    }

    return currency;
  }

  me.getCouponInput = function() {
    var $couponInput;

    if (context && context.coupon_input_box) {
      $couponInput = $(context.coupon_input_box);
    }
    else {
      $couponInput = $();
    }

    return $couponInput;
  };

  me.performNextStep = performNextStep;
  me.errorOccurred = errorOccurred;

})(this, undefined);

catc2.init();
