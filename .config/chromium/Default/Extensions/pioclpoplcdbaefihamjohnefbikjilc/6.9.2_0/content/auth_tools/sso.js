/*! Copyright 2009-2016 Evernote Corporation. All rights reserved. */
function ignoreSSO(a){Browser.getCurrentTab(function(b){a&&"function"==typeof a&&a(),EDGE?background.toggleClipper(null,{tab:b},closePopup):(background.toggleClipper(null,{tab:b}),closePopup())})}var background,bizName;window.addEventListener("DOMContentLoaded",function(){background=Browser.extension.getBackgroundPage().extension,bizName=decodeURIComponent(/bizName=([^&]+)/.exec(location.href)[1]),/china/i.test(background.getBootstrapInfo("name"))&&document.getElementById("logo").classList.add("china"),GlobalUtils.localize(document.body),document.getElementById("bizName").innerText=Browser.i18n.getMessage("corpBusinessNotes",[bizName]),document.getElementById("ignore").addEventListener("click",ignoreSSO),document.getElementById("proceed").addEventListener("click",function(){background.trackEvent({category:"Account",action:"sign_in",label:"completed"}),ignoreSSO(function(){background.openSSOPage()})}),document.getElementById("close").addEventListener("click",ignoreSSO)});