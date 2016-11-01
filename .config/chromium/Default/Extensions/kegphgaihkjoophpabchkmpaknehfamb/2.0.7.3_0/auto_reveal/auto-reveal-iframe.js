/*
 * Coupons at Checkout - Chrome Browser Extension
 * Copyright (c) 2012, 2013 CouponFollow, LLC.  All rights reserved.  Patent Pending.
 * Copying this source code in any manner is strictly prohibited.
 */

new (function(window, undefined) {

  var codeSelector = '#tab-coupons tr.coderow';

  function init() {
    // Check inner frames for our panel iframe
    if (window !== window.top) {
      // If we are on our iframe panel then invoke our event handler
      $(onCouponFollowFrame);
    }
  }

  // The event handler for our iframe panel
  function onCouponFollowFrame() {
    // Iterate over all coupon codes to add paste coupon event handlers
    $(codeSelector).each(function (index) {
      // Adds the paste coupon event handler to the couponfollow image button
      $(this).click(function (event) {
        pasteCoupon(event);
      });
    });
  }

  // Paste coupon event handler: asks the add-on object to do the job
  function pasteCoupon(event) {
    var data = {
      id: $(event.target).parents('tr').attr('data-id'),
      nt: $('#tab-coupons').attr('data-nt'),
      couponCode: $(event.target).parents('tr').attr('data-code') //$(event.target).text()
    };
    utils.log('pasteCoupon: data-nt = ' + data.nt);
    utils.log('pasteCoupon: couponCode = ' + data.couponCode);
    BS.sendMessage({
      call: "pasteCoupon",
      arg: data
    });
  }

  init();

})(this, undefined);
