/*
 * Coupons at Checkout - Chrome Browser Extension
 * Copyright (c) 2012, 2013 CouponFollow, LLC.  All rights reserved.  Patent Pending.
 * Copying this source code in any manner is strictly prohibited.
 */

var auto_reveal = new (function(window, undefined) {
  "use strict";

  var me = this;
  var panelWidth = 405;
  var panelHeight = 120;
  var couponInputSelector = 'input[data-catc="coupon_input"]';
  var url = document.location.href.toLowerCase();
  var domain = getDomain();
  var cf = {};
  var helper = {};
  var input = null;
  var autoRevealStarted = false;

  me.inputKeywords = ["discount", "promo", "coupon", "voucher", "redemption", "redeem", "ccode", "offer|code",
    "key|code", "referral|code", "gift|code", "source|code", "cert|code", "submit|code", "system|code", "claim|code"];
  me.$couponInput = null;
  me.autoApplyInputSelector = null;

  me.startAutoReveal = function(isCart) {
    // only start auto-reveal if it's not already started
    if (!autoRevealStarted && domain != "couponfollow.com") {
      if (catc2.settings.highlight == "Yes" || catc2.settings.highlight == "true") {
        $(function () {
          BS.onMessage(
            function (request, sender, sendResponse) {
              if (request.method == "pasteCoupon") {
                utils.simulateTextInput($(couponInputSelector), request.couponCode);
                $('#cf-panel').hide();
              }
            }
          );

          // Mark domain as visited
          BS.sendMessage({call: 'markVisited', arg: domain});

          // Get CouponFollow helpers and start the scraping process
          BS.sendMessage({call: 'cf'}, function (response) {
            cf = response;
            helper = cf.helpers[domain] || {};

            // Test current page for cart page
            if ((cf.blacklist[domain] == undefined) && (isCart || utils.isCart(helper.cartKeyword))) {
              if (helper.intervalTime) {
                helper.timer = setInterval(onCartPage, helper.intervalTime);
                helper.tries = 0;
              } else {
                onCartPage();
              }
            }
          });
        });

        autoRevealStarted = true;
      }
    }
    else {
      // if it's already started then make sure input box is highlighted
      if (me.$couponInput) {
        me.$couponInput.addClass("catc2InputHighlight");
      }
    }
  };

  me.hideAutoReveal = function () {
    if (me.$couponInput) {
      me.$couponInput.removeClass("catc2InputHighlight");
    }
  };

  function onCartPage() {
    if (helper.tries !== undefined) {
      helper.tries++;
    }

    input = me.getCouponInput();

    if (input && input.length > 0) {
      if (helper.timer) {
        resetTimer();
      }

      // Set our attribute so that we can find the input from the background page
      setCouponInputCustomAttribute(input);

      setHighlight();
    } else if (helper.maxTries && helper.maxTries > 1 && helper.tries == helper.maxTries) {
      resetTimer();
    }
  }

  function resetTimer() {
    clearInterval(helper.timer);
    helper.timer = null;
    helper.tries = 0;
  }

  // Adds custom attribute to the coupon input element
  function setCouponInputCustomAttribute(input) {
    input.attr('data-catc', 'coupon_input');
  }

  // Finds the coupon input element on the cart page
  me.scrapeCouponInputUsingARHelpersAndAlgo = function() {
    var input = null;

    // Use custom css selector if present
    if (helper.inputSelector) {
      return $(helper.inputSelector).first();
    }

    // Iterate over all the input text elements on the page
    var allInputs = $('input:text,input[type=text]');
    var visibleInputs = allInputs.filter(":visible");

    input = filterCouponInput(visibleInputs);

    if (input == null) {
      var hiddenInputs = $('input:text,input[type=text]').not(":visible");
      input = filterCouponInput(hiddenInputs);
    }

    return input;
  };

  function filterCouponInput(inputs) {
    var input = null;
    var matchedInputs = null;

    // If there are any input elements then we proceed
    if (inputs.size()) {

      // Add the custom input keyword to front of keyword array
      if (helper.inputKeyword) {
        me.inputKeywords.unshift(helper.inputKeyword);
      }

      // Iterate over our input keywords trying to find a match
      $.each(me.inputKeywords, function (index, keyword) {
        var parts = keyword.split('|');
        if (parts.length == 1) {
          // Find an input element according our algorithm
          matchedInputs = inputs.filter(
              function (index) {
                return ((($(this).attr("id")) && ($(this).attr("id").toLowerCase().indexOf(keyword) != -1)) ||
                (($(this).attr("name")) && ($(this).attr("name").toLowerCase().indexOf(keyword) != -1)));
              }).first();

          // If input is matched then exit
          if (matchedInputs.size()) {
            input = matchedInputs;
            return false;
          }
        } else {
          // Find an input element according our algorithm
          matchedInputs = inputs.filter(
              function (index) {
                return ((($(this).attr("id")) && ($(this).attr("id").toLowerCase().indexOf(parts[0]) != -1)) ||
                    (($(this).attr("name")) && ($(this).attr("name").toLowerCase().indexOf(parts[0]) != -1))) &&
                    ((($(this).attr("id")) && ($(this).attr("id").toLowerCase().indexOf(parts[1]) != -1)) ||
                    (($(this).attr("name")) && ($(this).attr("name").toLowerCase().indexOf(parts[1]) != -1)));
              }).first();

          // If input is matched then exit
          if (matchedInputs.size()) {
            input = matchedInputs;
            return false;
          }
        }
        //Final check for exact match on "code"
        matchedInputs = inputs.filter(
            function (index) {
              return ((($(this).attr("id")) && ($(this).attr("id").toLowerCase() == "code")) ||
              (($(this).attr("name")) && ($(this).attr("name").toLowerCase() == "code")));
            }).first();

        // If input is matched then exit
        if (matchedInputs.size()) {
          input = matchedInputs;
          return false;
        }
        return true;
      });
    }

    return input;
  }

  // Injects the couponfollow iframe
  function injectFrame($input, shouldHighlight) {

    // Inject only if not already injected
    if ($('#cf-panel').size() == 0) {
      $input.click(function (event) {
        if (typeof catc2 === "undefined" || !catc2.autoApplyRunning) {
          showCouponsPanel(event);
        }
      });
      utils.log('injectCouponInput: coupon input click event handler attached');
      // Highlight the coupon input if configured
      if (shouldHighlight) {
        if (!catc2.autoApplyRunning) {
          $input.addClass("catc2InputHighlight");
        }
        utils.log('injectCouponInput: coupon input highlighted');
      }
      // Preload the iframe so that there is no delay when shown
      // Get the coupons iframe URL taking into account the browsing history
      // Re-route the iframe loading through getHistory event handler
      // as we need to query the add-on object for the user browsing history
      BS.sendMessage({
        call: 'getHistory',
        arg: {
          point: {
            top: 0,
            left: 0
          }
        }
      }, function (response) {
        markVisited(response);
      });
    }
  }

  // The event handler that receives the user browsing history from the add-on object
  // Also used to display the coupons panel afterwards
  function markVisited(data) {

    // Get the coupons iframe URL taking into account the browsing history
    var frameURL = getCouponPage(data.history);

    // Define the CP iframe element
    var $frame = $('<iframe>', {
      id: 'couponfollowIfr',
      name: 'ar-frame',
      type: 'content',
      frameborder: '0',
      scrolling: 'no',
      src: frameURL,
      width: panelWidth + 'px',
      heigth: panelHeight + 'px',
      css: {
        display: 'block',
        visibility: 'visible'
      }
    });

    // Create the CF panel element as DIV and append to body
    $('<div>', {
      id: 'cf-panel',
      css: {
        display: 'none',
        position: 'absolute',
        'box-shadow': '4px 4px 2px #A8A8A8',
        'background-color': 'white',
        top: data.point.top + 'px',
        left: data.point.left + 'px',
        height: panelHeight + 'px',
        width: panelWidth + 'px',
        border: '1px solid grey',
        'z-index': '2147483647',
        overflow: 'hidden'
      }
    }).append($frame).appendTo('body');

    // Make sure it hides when user clicks anywhere else
    $(document).click(function () {
      $('#cf-panel').hide();
    });
  }

  // Receives the highlight configuration option
  function setHighlight() {
    //utils.log('setHighlight: highlight = ' + data.highlight);
    var $input = $(couponInputSelector);
    utils.log('setHighlight: coupon input found = ' + $input.size());
    injectFrame($input, true);
  }

  // Returns the coupon iframe URL build based on browsing history
  function getCouponPage(history) {
    return 'https://couponfollow.com/sites/' + domain + '/?ref=' + history;
  }

  // Extracts the domain from the given URL
  function getDomain() {
    var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
    if (re.test(url)) {
      return url.match(re)[1].toString().replace(/www./i, '');
    } else {
      return url;
    }
  }

  // Show or hides the coupons panel
  function showCouponsPanel(aEvent) {
    if ($('#cf-panel').size()) {
      if ($('#cf-panel:hidden').size()) {
        // Make sure it is displayed at current mouse pointer
        var point = calculateViewportCoordinates(aEvent);
        $('#cf-panel').css({
          top: point.top + 'px',
          left: point.left + 'px'
        });
        $('#cf-panel').show();
      } else {
        $('#cf-panel').hide();
      }
    }
    aEvent.stopPropagation();
  }

  // Utility method to calculate the coordinates where to display the coupons panel
  function calculateViewportCoordinates(aEvent) {
    var point = {
      top: aEvent.pageY,
      left: aEvent.pageX
    };
    var inputOffset = input.offset();
    var offset = input.offset();
    var x = aEvent.pageX - (offset.left);
    var y = aEvent.pageY - (offset.top);
    var addX = (input.outerWidth() - x) - input.outerWidth(); //get total height - offset of click
    var addY = input.outerHeight() + 1 - y; //get total height - offset of click
    point.top = aEvent.pageY + addY;
    point.left = aEvent.pageX + addX;
    var endOfDivY = aEvent.clientY + panelHeight; // this.panelHeight
    var endOfDivX = aEvent.clientX + panelWidth; // + this.panelWidth;
    if (window.innerHeight < endOfDivY) {
      point.top = aEvent.pageY - panelHeight - input.height() - y + 3;
    }
    if (window.innerWidth < endOfDivX) {
      point.left = aEvent.pageX - x - panelWidth + input.outerWidth();
    }
    return point;
  }

  me.getCouponInput = function() {
    if (!me.$couponInput || me.$couponInput.length == 0) {
      var input = null;
      // use Auto-apply selectors as primary method to detect coupon input box
      if (me.autoApplyInputSelector) {
        input = $(me.autoApplyInputSelector);
      }

      if (!input || input.length == 0) {
        input = me.scrapeCouponInputUsingARHelpersAndAlgo();
        if (input != null && input.length > 0) {
          Logger.log("Auto-Reveal: Coupon input box found using AR helpers or generic method");
        }
      }
      else {
        Logger.log("Auto-Reveal: Coupon input box found using auto-apply selectors");
      }

      me.$couponInput = input;
    }

    return me.$couponInput;
  };

})(this, undefined);
