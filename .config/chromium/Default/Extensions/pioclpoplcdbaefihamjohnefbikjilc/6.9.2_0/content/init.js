/*! Copyright 2009-2016 Evernote Corporation. All rights reserved. */
var contentPreview,clipper,clipResultCoordinator,feedbackFormCoordinator,coordinator,GlobalUtils;reqC(["Clipper","ContentPreview","Coordinator","GlobalUtils","Promotion","topFrame!pageVisible!"],function(a,b,c,d,e){function f(){var a=!1,b=document.getElementsByTagName("embed")[0];if(b&&/application\/pdf/i.test(b.type))a=!0;else if(/^https?:\/\/docs\.google\.com\/viewer\?url=.+/.test(document.location.href))for(var c=0;c<document.scripts.length;c++)if(/gviewApp\.setFileData/.test(document.scripts[c].innerText)){/mimeType.+application\/pdf/.test(document.scripts[c].innerText)&&(a=!0);break}Browser.sendToExtension({name:"togglePDFContextMenuOption",show:a})}function g(){SAFARI||(f(),window.addEventListener("focus",function(){f()})),contentPreview=b,clipper=a,clipResultCoordinator=new ClipResultCoordinator,feedbackFormCoordinator=new FeedbackFormCoordinator,coordinator=c,GlobalUtils=d,k&&e.enable(),j=!0}function h(){k=!0,j&&e.enable()}function i(a,b,c){a.data&&Browser.i18n._setL10nData(a.data),g()}var j=!1,k=!1;Browser.addMessageHandlers({l10nData:i,enableSaveToEvernote:h}),SAFARI?Browser.sendToExtension({name:"main_getL10n"}):g()});