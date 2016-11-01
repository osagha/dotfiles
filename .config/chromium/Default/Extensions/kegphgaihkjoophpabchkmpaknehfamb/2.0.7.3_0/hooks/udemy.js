var Hooks = new (function(window, undefined) {

  this.isCart = function (callback) {
    $(function() {
      callback($(".redeem").length > 0);
    });
  };

  this.hasRequiredApplyElements = function (callback) {
    return $(".redeem").length > 0 && $(".current-price").length > 0;
  };

  this.applyCode = function(code) {
    var currentUrl = location.href,
        newUrl;
    // if couponCode parameter is already present replace existing couponCode parameter with new coupon code
    if (currentUrl.indexOf("couponCode") != -1) {
      newUrl = location.href.replace(/couponCode=([^&]*)/i, "couponCode=" + code);
    }
    else {
      if (currentUrl.indexOf("?") == -1) {
        newUrl = currentUrl + "?couponCode=" + code;
      }
      else {
        newUrl = currentUrl + "&couponCode=" + code;
      }
    }
    location.href = newUrl;
  };

})();
