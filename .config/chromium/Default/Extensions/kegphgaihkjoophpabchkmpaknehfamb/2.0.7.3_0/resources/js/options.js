var codeRevealer = document.getElementById("code-revealer");
var showAutoApplyBox = document.getElementById('savings-guard');

function addListeners()
{
  // update setting when value is changed
  codeRevealer.addEventListener("change", function() {
    BS.storage.sync.set({
      highlight: codeRevealer.value
    });
  });

  // update setting when value is changed
  showAutoApplyBox.addEventListener("change", function() {
    BS.storage.sync.set({
      showAutoApplyBox: showAutoApplyBox.value
    });
  });
}

// Restores select box state to saved value from chrome storage.
function restore_options() {
  BS.storage.sync.get({
    highlight: "Yes",
    showAutoApplyBox: "Yes"
  }, function(items) {
      codeRevealer.value = items.highlight;
      showAutoApplyBox.value = items.showAutoApplyBox;
  });
}

addListeners();
restore_options();

