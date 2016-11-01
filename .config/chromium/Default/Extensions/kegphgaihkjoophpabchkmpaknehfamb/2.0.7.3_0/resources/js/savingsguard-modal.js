(function(window, undefined) {

  var defaultSuccessText = "Yoink! You just saved {{savingsAmount}}!",
      defaultSuccessImageUrl = BS.getURL("/resources/img/success-image-2@2x.png"),
      twitterShareMessage = "Just saved some cash using the Coupons at Checkout app! http://couponfollow.com/checkout via @couponfollow",
      shareViaEmailSubject = "Just saved some cash using the Coupons at Checkout app!",
      shareViaEmailMessage = "Just saved some cash using the Coupons at Checkout app! Check it out here <a href='http://couponfollow.com/checkout'>http://couponfollow.com/checkout</a>",
      domainName = null,
      domainNameId = null,
      currentPage = "applyingCodes",
      successfulSavingsBeforeFeedback = 2,
      delayBeforeShowingFeedbackFooterAgain = Config.delayBeforeShowingFeedbackFooterAgain;

  function init() {
    BS.onMessage(onMessageReceived);

    BS.sendMessage({ method: 'progressRequest' });

    Logger.log("SavingsGuard-Modal: Progress request sent");

    $(".cancel").click(cancelAutoApply);
    $(".share").click(onShareClicked);

    var $writeReviewBtn = $("#writeReviewBtn");

    $writeReviewBtn.attr("href", BS.reviewLink);
    $("#shareOnTwitter").attr("href", "https://twitter.com/share?text=" + encodeURIComponent(twitterShareMessage));
    $("#shareOnFacebook").attr("href", "https://www.facebook.com/dialog/feed?app_id=127431234007095&display=popup&link=" + encodeURIComponent("http://couponfollow.com/checkout") + "&redirect_uri=" + encodeURIComponent("http://couponfollow.com/checkout"));

    var mailtoUrl = "mailto:?subject=" + encodeURIComponent(shareViaEmailSubject) + "&body=" + encodeURIComponent(shareViaEmailMessage);
    if (BS.browser == "firefox") {
      // workaround for a bug in firefox where it always open mailto link in the same tab/frame, see issue #252
      mailtoUrl = "javascript:location.href=\"" + mailtoUrl + "\";";
    }
    $("#shareViaEmail").attr("href", mailtoUrl);

    $("#storeName").text(BS.storeName);

    $("#happyBtn").click(function() {
      showFooter("writeReviewFooter");
    });

    $("#justOkBtn, #unhappyBtn").click(function() {
      showFooter("sendFeedbackFooter");
    });

    $writeReviewBtn.click(function() {
      BS.lscache.set("clickedWriteReviewBtn", true);

      cancelAutoApply();
    });

    $("#notifyMeBtn").click(saveEmail);

    $(".sendFeedbackBtn").click(openInPopup);
  }

  function onMessageReceived(request, sender, sendResponse)
  {
    if (request.for == "iframe") {
      if (request.method === 'applyingNextCode') {
        applyingCode(request);
      }
      else if (request.method === 'applyingBestCode') {
        applyingBestCode();
      }
      else if (request.method == 'autoApplyCompleted') {
        autoApplyCompleted(request);
      }
      else if (request.method == 'errorOccurred') {
        showErrorPage(request)
      }

      // when auto-apply is complete, allow user to close modal by clicking outside the modal dialog
      if (request.method == 'autoApplyCompleted' || request.method == 'errorOccurred') {
        $(".savingsguard-body").click(function(e) {
          if (e.target == this) {
            cancelAutoApply();
          }
        });
      }

      Logger.log("SavingsGuard-Modal: Update received. From = " + request.from);
    }
  }

  function showErrorPage(data) {
    var $errorFeedBackBtn = $("#errorPage .sendFeedbackBtn");
    $errorFeedBackBtn.attr("href", $errorFeedBackBtn.attr("href") + "?ref=" + data.domainName + "&type=error");
    showPage("errorPage");
  }

  // updates coupon apply progress bar
  function applyingCode(data) {
    var message = "We’re automatically trying " + data.totalCodes + " coupon codes for you...";
    $("#message").text(message);

    var progressBar = document.getElementById("progressBar");
    progressBar.value = data.current;
    progressBar.max = data.totalCodes;

    $("#progressText").text("APPLYING CODE " + data.current + " OF " + data.totalCodes);

    showPage("applyingCodes");
  }

  function applyingBestCode() {
    showPage("applyingBestCode");
  }

  // called on auto apply completed, shows either savings or no savings page
  function autoApplyCompleted(data) {
    var $sendFeedbackBtn = $(".sendFeedbackBtn");
    $sendFeedbackBtn.attr("href", $sendFeedbackBtn.attr("href") + "?ref=" + data.domainName);

    if (data.savings > 0) {
      var showFeedbackFooter = false,
          successfulSavingsCounter = 0;

      BS.lscache.get("clickedWriteReviewBtn", function(clickedWriteReviewBtn) {
        // if user has clicked 'Write Review' previously don't show feedback footer
        if (!clickedWriteReviewBtn) {
          BS.lscache.get("savedPreviously", function (savedPreviously) {
            // if this is the first time user has saved using catc2 then we want to show feedback footer
            if (!savedPreviously) {
              BS.lscache.set("savedPreviously", true);
              showFeedbackFooter = true;
              showSuccessPage(data, showFeedbackFooter, successfulSavingsCounter);
            }
            else {
              // show feed back footer if user has had at least 2 successes since last asked AND timed delay at least 3 weeks
              // since last shown
              BS.lscache.get("successfulSavingsCounter", function (successSavingsCounter) {
                if (successSavingsCounter !== undefined) {
                  successfulSavingsCounter = successSavingsCounter;
                }

                if (successfulSavingsCounter >= successfulSavingsBeforeFeedback) {
                  BS.lscache.get("dontShowFeedbackFooterYet", function (dontShowFeedbackFooterYet) {
                    if (!dontShowFeedbackFooterYet) {
                      showFeedbackFooter = true;
                    }

                    successfulSavingsCounter++;

                    showSuccessPage(data, showFeedbackFooter, successfulSavingsCounter);
                  });
                }
                else {
                  successfulSavingsCounter++;
                  showSuccessPage(data, showFeedbackFooter, successfulSavingsCounter);
                }
              });
            }
          });
        }
        else {
          BS.lscache.get("successfulSavingsCounter", function (successSavingsCounter) {
            if (successSavingsCounter !== undefined) {
              successfulSavingsCounter = successSavingsCounter;
            }
            
            showSuccessPage(data, false, successfulSavingsCounter);
          });
        }
      });
    }
    else {
      if (data.requestText) {
        $requestACoupon = $("#requestACoupon");
        $requestACoupon.attr("href", "https://twitter.com/share?via=couponfollow&text=" + encodeURIComponent(data.requestText));
        $requestACoupon.click(openInPopup);

        $("#noSavings_requestACoupon .domainName").text(data.domainName);

        showPage("noSavings_requestACoupon")
      }
      else {
        domainNameId = data.domainNameId;
        domainName = data.domainName;
        $("#noSavings_notify .domainName").text(domainName);

        BS.lscache.get("email." + domainName, function(emailAlreadyCaptured) {
          if (emailAlreadyCaptured) {
            showFooter("closeModal", "noSavings_notify");
          }
          else {
            showFooter("notifyMeFooter", "noSavings_notify");
          }

          showPage("noSavings_notify");
        });
      }
    }
  }

  function showSuccessPage(data, showFeedbackFooter, successfulSavingsCounter) {
    var successText = defaultSuccessText,
      successImageUrl = defaultSuccessImageUrl,
      footerType = "shareSavingsFooter";

    if (showFeedbackFooter) {
      footerType = "rateCatc2";
      successfulSavingsCounter = 0;
      BS.lscache.set("dontShowFeedbackFooterYet", true, delayBeforeShowingFeedbackFooterAgain);
    }

    BS.lscache.set("successfulSavingsCounter", successfulSavingsCounter);

    // if successText is passed through selectors then show that success message otherwise show default
    if (data.successText) {
      successText = data.successText
    }
    if (data.successImageUrl) {
      successImageUrl = data.successImageUrl;
    }

    var savingsText = null;
    if (data.currency != null && data.savings <= 999) {

      // don't display the part after decimal point if it's zero
      if (data.savings % 1 == 0) {
        data.savings = parseFloat(data.savings).toFixed();
      }

      savingsText = data.currency + data.savings;
    }
    else {

      // don't display the part after decimal point if it's zero
      if (data.percentageSavings % 1 == 0) {
        data.percentageSavings = parseFloat(data.percentageSavings).toFixed();
      }

      savingsText = data.percentageSavings + "%";
    }

    successText = utils.escapeHtml(successText);
    savingsText = utils.escapeHtml(savingsText);

    successText = successText.replace("{{savingsAmount}}", '<strong class="popup__saving-amount">' + savingsText + '</strong>');

    if (data.shareTweet) {
      $("#shareOnTwitter").attr("href", "https://twitter.com/share?text=" + encodeURIComponent(data.shareTweet.replace("{{savingsAmount}}", savingsText)));
    }

    showFooter(footerType, "couponSuccess");

    $("#successImageUrl").attr("src", successImageUrl);
    $("#successText").html(successText);
    showPage("couponSuccess");
  }

  // switch to another page of the modal
  function showPage(pageId) {
    $(".popup").hide();

    var $currentPage = $("#" + pageId);
    $currentPage.show();

    currentPage = pageId;

    $("body").css("opacity", "1");
  }

  // switch to another footer
  function showFooter(footerType, pageId) {
    if (!pageId) {
      pageId = currentPage;
    }

    $("#" + pageId + " .footers .popup__footer").hide();
    $("#" + footerType).show();
  }

  // close this modal
  function cancelAutoApply() {
    msgToMainWindow({ method: "cancelAutoApply" });
  }

  // to send message to content.js script
  function msgToMainWindow(msg)
  {
    msg.for = "mainWindow";
    BS.sendMessage(msg);
  }

  // open links in popup when twitter/facebook share buttons are clicked
  function onShareClicked(e)
  {
    e.preventDefault();

    BS.openPopup(this.href, { width: 690, height: 315, centerAlign: true });
  }

  // opens an href link in popup
  function openInPopup(e) {
    e.preventDefault();

    BS.openPopup(this.href, { width: 500, height: 615, centerAlign: true });

    cancelAutoApply();
  }

  // sends email to server when user clicks on Notify Me of new coupons
  function saveEmail(e) {
    var $emailInput = $("#emailInput"),
        $notifyMeForm = $("#notifyMeForm"),
        $notifyMeBtn = $("#notifyMeBtn"),
        email = $emailInput.val();

    if (!$notifyMeForm[0].checkValidity()) {
      return;
    }

    e.preventDefault();

    if (email.length > 0) {
      $notifyMeBtn.attr("disabled", "disabled");
      $notifyMeBtn.css("background-color", "lightgray");

      $.ajax({
       url: Config.domain + 'Ajax/Monitor/subscribe',
       method: "POST",
       data: 'domainName=' + domainName + '&domainNameid=' + domainNameId + '&email=' + email + '&iscatc=yes'
       }).done(function () {
        BS.lscache.set("email." + domainName, true);
        cancelAutoApply();
       });
    }
  }

  init();

})(this, undefined);