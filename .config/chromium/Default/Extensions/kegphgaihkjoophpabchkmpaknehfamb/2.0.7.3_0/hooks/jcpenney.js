var Hooks = new (function(window, undefined) {

	// on successful code apply the page refreshes so we don't need to listen for coupon_area, if we do it
	// causes page refresh immediately after applying best code thus not showing the saved value dialog for
	// enough time
	this.skipCouponSuccessWatch = function() {
		return true;
	};

	this.triggerCouponErrorMessage = function($errorElem) {
		return $errorElem.is(":visible");
	}

})();
