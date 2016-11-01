var Hooks = new (function(window, undefined) {

  this.beforeCouponResultCheck = function(context) {
    var $applyConfirmBtn = $("#promo-confirmation input[value='Apply'],button.promo-confirmation");
    if ($applyConfirmBtn.length > 0) {
	
	  //skip page if it wants to customize order
	  if ($applyConfirmBtn.val().indexOf('Customize') !== -1)
	  {
		location.href = "https://www.papajohns.com/order/view-cart";
	  }
	  else
	  {      
		// this is a coupon apply confirmation page, just click the apply button to continue applying coupon
		utils.simulateClick($applyConfirmBtn[0]);
	  }
      return false; // do not continue, will continue after coupon code is applied
    }
    else if ($(context.coupon_input_box).length == 0) {
      // we are not on a cart page, go to cart page
      location.href = "https://www.papajohns.com/order/view-cart";
      return false; // do not continue, will continue after we are on view-cart page
    }

    return true;
  };

})();
