new (function() {

  var queryParamsToAttach;

  function init() {
    $('#sharesavings').click(function() {
      BS.windows.create({url: "https://twitter.com/intent/tweet?text=Coupons%20at%20Checkout%20is%20helping%20me%20save%20some%20cash%2C%20check%20it%20out&url=http%3A%2F%2Fcouponfollow.com%2Fcheckout&via=couponfollow", type: "popup", width: 620, height: 490});
    });

    $("#writeReview").attr("href", BS.reviewLink).click(function() {
      BS.lscache.set("clickedWriteReviewBtn", true);
    });

    $("#optionsPage").click(function() {
      chrome.runtime.openOptionsPage();
    });

    if (BS.browser == "firefox") {
      // in case of firefox, popup is not closed automatically when a link is opened in new tab so we need to close manually
      $(".close").click(function() {
        self.port.emit("closePopup");
      });

      // preferences page can't be opened programmaticaly in firefox so we hide the settings icon
      $("#optionsPage").hide();
    }

    $('#submitcode').click(function() {
      BS.windows.create({url: "http://couponfollow.com/checkout/submit" + queryParamsToAttach, type: "popup", width: 610, height: 433});
    });
    $('#submitfeedback').click(function() {
      BS.windows.create({url: "http://couponfollow.com/checkout/popup/feedback" + queryParamsToAttach, type: "popup", width: 640, height: 580});
    });

    $(".toggle-button").click(onToggleClicked);

    loadSettings();

    if (BS.browser == "firefox") {
      listenPrefChanges();
    }

    // in case of firefox, only one instance of popup is created when extension starts (contrary to chrome extension where a new
    // instance is created whenever popup is opened) so we need to recalculate query params whenever popup is shown to get
    // correct domain of currently active tab
    if (BS.browser == "firefox") {
      self.port.on("popupShown", function() {
        setQueryParamsToPass();
        showFooter();
      });

      self.port.on("popupHide", function() {
        $("body").hide();
      });

      // body will be shown when popup is shown and loaded
      $("body").hide();
    }
    else {
      setQueryParamsToPass();

      showFooter();
    }
  }

  function onToggleClicked() {
    var $this = $(this),
      checked;
    if ($this.hasClass("checked")) {
      $this.removeClass("checked");
      checked = false;
    }
    else {
      $this.addClass("checked");
      checked = true;
    }

    var obj = {},
      name = $this.attr("name");
    obj[name] = checked ? "Yes" : "No";

    BS.storage.sync.set(obj);

    // to keep preferences in sync when a pref is changed from popup
    if (BS.browser == "firefox") {
      self.port.emit("prefChange", { name: name, value: checked });
    }
  }

  function loadSettings() {
    BS.storage.sync.get({
      highlight: "Yes",
      showAutoApplyBox: "Yes"
    }, function(items) {

      if (items.highlight == "No") {
        $("#code-revealer").removeClass("checked");
      }

      if (items.showAutoApplyBox == "No") {
        $("#savings-guard").removeClass("checked");
      }

    });
  }

  function listenPrefChanges() {
    self.port.on("prefChange", function(pref) {
      var $toggleBtn = $('.toggle-button[name="' + pref.name + '"]');
      pref.value ? $toggleBtn.addClass("checked") : $toggleBtn.removeClass("checked");
    });
  }

  function setQueryParamsToPass() {
    BS.getActiveTab(function(tab) {
      queryParamsToAttach = "";
      if (tab != null) {
        queryParamsToAttach = "?ref=" + utils.extractDomain(tab.url);
      }
    });
  }

  function showFooter() {
    BS.lscache.get("savedPreviously", function(savedPreviously) {
      BS.lscache.get("clickedWriteReviewBtn", function(clickedWriteReviewBtn) {
        var rateCatc2Footer = document.getElementsByClassName("m--rate")[0],
          shareFooter = document.getElementsByClassName("m--share")[0];

        // show "Write Review" 50% of the time after user has 1 good experience
        if (savedPreviously && !clickedWriteReviewBtn && utils.getRandomNum(0, 1) == 1) {
          shareFooter.style.display = "none";
          rateCatc2Footer.style.display = "block";
        }
        else {
          shareFooter.style.display = "block";
          rateCatc2Footer.style.display = "none";
        }

        $("body").fadeIn(200);
      });
    });
  }

  init();

})();
