var Hooks = new (function(window, undefined) {

  this.beforeRemoveCode = function() {
    $(".remote-delete").removeAttr("data-confirm");
  };

})();
