/*! Copyright 2009-2016 Evernote Corporation. All rights reserved. */
require(["../require/require-config"],function(){require(["domReady!"],function(){function a(a){location.href=baseUrl+"/SetAuthToken.action?auth="+encodeURIComponent(a.tempToken)+"&targetUrl="+encodeURIComponent(targetUrl)}var b,c=/(?:^\?|&)([^=]+)=([^&]+)/g;do b=c.exec(location.search),b&&(window[b[1]]=decodeURIComponent(b[2]));while(b);if(SAFARI)Browser.addMessageHandlers({receiveTempToken:a}),Browser.sendToExtension({name:"getTempToken"});else{var d=chrome.extension.getBackgroundPage().extension;d.getTempToken(function(b){a({tempToken:b})})}})});