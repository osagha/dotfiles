var Hooks = new (function(window, undefined) {

  this.dontApplyBestCode = true;

  this.hasRequiredApplyElements = function (callback) {
    return $(".order_summary_wrapper").length > 0;
  };

  /*
   * Opens the kohls dialog where coupon codes are applied
   */
  this.startAutoApply = function(context) {
    if ($(context.coupon_input_box).length == 0) {
      var $autoApplyBtn = $(".kohlscashapply");
      if ($autoApplyBtn.length > 0) {
        document.arrive(context.coupon_input_box, { onceOnly: true }, function() {
          catc2.performNextStep();
        });

        utils.simulateClick($autoApplyBtn[0], "click");
      }
      else {
        catc2.errorOccurred("Custom hook: Popup open button not found. Selector = .kohlscashapply");
      }
    }
    else {
      catc2.performNextStep();
    }
  };

  this.getCurrentCartValue = function(context, currentCode, autoApplyCompleted) {
    if (autoApplyCompleted) {
      return context.originalCartValue - getTotalSavings();
    }

    var couponSaving = 0;

    if (currentCode) {
      couponSaving = getCouponSaving(currentCode);
    }

    return (context.originalCartValue - couponSaving).toFixed(2);
  };

  /*
   * Returns saving amount for currentCode
   */
  function getCouponSaving(currentCode) {
    var $couponsList = $("#qualifiedList");

    currentCode = currentCode.trim().toLowerCase();

    var $couponCode = $couponsList.find(".promo-style").filter(function() {
      if ($(this).text().trim().toLocaleLowerCase() == currentCode) {
        return this;
      }
    });

    var couponSaving = 0;

    if ($couponCode.length > 0) {
      var $couponValue = $couponCode.closest(".discount-contents").find(".applied-amount").first();

      couponSaving = utils.convertToNumber($couponValue.text());

      if (isNaN(couponSaving)) {
        couponSaving = 0;
      }
    }

    return couponSaving;
  }

  /*
   * Returns total savings for all applied coupons
   */
  function getTotalSavings() {
    var total = 0;
    var $couponsPanels = $("#qualifiedList .discount-contents");

    $couponsPanels.each(function() {
      var $couponValue = $(this).find(".applied-amount:first");

      var couponSaving = utils.convertToNumber($couponValue.text());

      if (!isNaN(couponSaving)) {
        total += couponSaving;
      }
    });

    return total;
  }

});
