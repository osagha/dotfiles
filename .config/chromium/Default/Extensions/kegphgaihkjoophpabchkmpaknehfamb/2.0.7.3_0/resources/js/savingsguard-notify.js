var overlay = new (function(window, undefined) {

  function init() {
    document.getElementById("startAutoApply").addEventListener("click", onAutoApplyClicked);
    document.getElementById("close").addEventListener("click", closeDialog);
  }

  function onAutoApplyClicked() {
    BS.sendMessage({
      method: "startAutoApply"
    });
  }

  function closeDialog() {
    var queryParams = utils.parseQueryParams("#");
    BS.sendMessage({
      method: "disableAutoApplyForTab",
      domain: queryParams.domainName
    });

    msgToMainWindow({ method: "closeAutoApplyOverlay" });
  }

  function msgToMainWindow(msg)
  {
    msg.for = "mainWindow";
    BS.sendMessage(msg);
  }

  init();

})(this, undefined);
