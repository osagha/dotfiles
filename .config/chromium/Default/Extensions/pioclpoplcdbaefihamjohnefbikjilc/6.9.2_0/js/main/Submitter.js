/*! Copyright 2009-2016 Evernote Corporation. All rights reserved. */
function Submitter(a,b,c,d,e,f){"use strict";function g(a,b,c,d,e){D.resources||(D.resources=[]);var f=o(a,b),g=h(a.buffer,f,c,d,e);D.resources.push(g),z+=g.data.body.byteLength,b.parentNode.replaceChild(i(a.buffer,f,b),b)}function h(a,b,c,d,e){var f=new Resource;if(f.data=new Data,f.data.body=a,f.mime=b,f.attributes=new ResourceAttributes,f.attributes.sourceURL=GlobalUtils.removeControlCharacters(c),f.attributes.fileName=d,!d&&c){var g=/.+\/(.+?)(?:$|[\?\/])/.exec(c);if(g)try{f.attributes.fileName=decodeURIComponent(g[1])}catch(h){if("URIError"!==h.name)throw h;f.attributes.fileName=unescape(g[1])}}return f.attributes.fileName&&!m(f.attributes.fileName,b)&&(f.attributes.fileName+=n(b)),f.attributes.fileName&&(f.attributes.fileName=GlobalUtils.removeControlCharacters(f.attributes.fileName)),f.attributes.attachment=!!e,f}function i(a,b,c){var d=E.createElement("en-media");d.setAttribute("type",b),d.setAttribute("hash",SparkMD5.ArrayBuffer.hash(a));for(var e=0;e<c.attributes.length;e++){var f=c.attributes[e].name.toLowerCase();J.indexOf(f)>-1&&d.setAttribute(f,c.attributes[e].value)}return d}function j(a,b,c,d,e,f,g,h,i,j,k){D.attributes=new NoteAttributes,"clearly"===i?D.attributes.source="Clearly":"external"===i?D.attributes.source="External":D.attributes.source="web.clip",D.attributes.sourceURL=GlobalUtils.removeControlCharacters(h),D.content='<?xml version="1.0" encoding="utf-8"?><!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note>',g&&g.trim()&&(D.content+=GlobalUtils.escapeXML(g)+"<hr/>"),D.content+='<div style="-evernote-webclip:true">',D.content+="<br/>"+j+"<br/></div></en-note>";var l=new DOMParser;E=l.parseFromString(GlobalUtils.removeControlCharacters(D.content,!0),"application/xml");for(var m=E.querySelectorAll("img[src], embed[src], div[evernote_attachment_url]"),n=0;n<m.length;n++){var o=m[n],h=o.getAttribute("src")||o.getAttribute("evernote_attachment_url");h&&(H.test(h)?q(H.exec(h)[1],o):I.test(h)?s(k[I.exec(h)[1]-0],o):r(h,o))}D.title=a,D.notebookGuid=b,w=c,x=d,y=e,f&&f.length>0&&(D.tagNames=f),A=!0,u()}function k(b){var c;switch(b.name){case"EDAMNotFoundException":"Note.notebookGuid"==b.identifier&&(c="unknownNotebook");break;case"EDAMUserException":switch(b.errorCode){case EDAMErrorCode.BAD_DATA_FORMAT:switch(b.parameter){case"Note.content":c="noteSizeExceeded"}break;case EDAMErrorCode.LIMIT_REACHED:switch(b.parameter){case"Note":c="overAccountMax";break;case"Note.size":c="noteSizeExceeded";break;case"Note.resources":c="noteSizeExceeded";break;case"Resource.data.size":c="noteSizeExceeded"}break;case EDAMErrorCode.QUOTA_REACHED:"Accounting.uploadLimit"==b.parameter&&(c="overQuota")}}1!=b.isTrusted&&navigator.onLine!==!1||(c="network",log.error("Network error. URL: "+D.attributes.sourceURL+", notestore: "+G+", exception object: "+JSON.stringify(b))),c||(log.error(D.attributes.sourceURL+", "+G+", "+b.__proto__.name+", "+JSON.stringify(b)),c="unknown"),"noteSizeExceeded"===c?extension.trackEvent({category:"Errors",action:"Too big",label:D.attributes.sourceURL}):"overQuota"===c?extension.trackEvent({category:"Errors",action:"Over quota",label:D.attributes.sourceURL}):"overAccountMax"===c?extension.trackEvent({category:"Errors",action:"Over account max",label:D.attributes.sourceURL}):"network"===c?extension.trackEvent({category:"Errors",action:"Network",label:JSON.stringify(b).substr(0,200)}):extension.trackEvent({category:"Errors",action:"Thrift: "+JSON.stringify(b).substr(0,200),label:D.attributes.sourceURL});var e="unknown"===c?JSON.stringify(b):null;d({name:"fail",error:c,exceptionJSON:e,tokens:a})}function l(b){function e(){var e={name:"success",noteSize:z,noteGuid:b.guid,shardId:/^"?S=([^:]+)/.exec(F)[1],notebookName:w,noteStoreUrl:G,noShareNotes:x,tokens:a,userIds:c,notebookType:y};!e.notebookName||e.noShareNotes!==!0&&e.noShareNotes!==!1?v.getNotebook(F,b.notebookGuid,function(a){e.notebookName=a.name,e.noShareNotes=a.restrictions.noShareNotes,d(e)},function(a){log.error(a.name+" "+JSON.stringify(a)),d(e)}):d(e)}e()}function m(a,b){return b===EDAM_MIME_TYPE_JPEG?/\.jpe?g$/.test(a):b===EDAM_MIME_TYPE_PNG?/\.png$/.test(a):b===EDAM_MIME_TYPE_GIF?/\.gif$/.test(a):b===EDAM_MIME_TYPE_PDF?/\.pdf$/.test(a):"image/webp"!==b||/\.webp$/.test(a)}function n(a){return a===EDAM_MIME_TYPE_JPEG?".jpg":a===EDAM_MIME_TYPE_PNG?".png":a===EDAM_MIME_TYPE_GIF?".gif":a===EDAM_MIME_TYPE_PDF?".pdf":"image/webp"===a?".webp":""}function o(a,b){if(b&&b.hasAttribute("evernote_attachment_mime")){var c=b.getAttribute("evernote_attachment_mime");if(c.toLowerCase()!==EDAM_MIME_TYPE_DEFAULT&&new RegExp(EDAM_MIME_REGEX).test(c))return c}if(255===a[0]&&216===a[1]&&255===a[2])return EDAM_MIME_TYPE_JPEG;if(137===a[0]&&80===a[1]&&78===a[2]&&71===a[3]&&13===a[4]&&10===a[5]&&26===a[6]&&10===a[7])return EDAM_MIME_TYPE_PNG;if(0===a[0]&&0===a[1]&&1===a[2]&&0===a[3])return EDAM_MIME_TYPE_PNG;if(71===a[0]&&73===a[1]&&70===a[2]&&56===a[3]&&(55===a[4]||57===a[4])&&97===a[5])return EDAM_MIME_TYPE_GIF;if(37===a[0]&&80===a[1]&&68===a[2]&&70===a[3])return EDAM_MIME_TYPE_PDF;if(82===a[0]&&73===a[1]&&70===a[2]&&70===a[3]&&87===a[8]&&69===a[9]&&66===a[10]&&80===a[11])return"image/webp";if(208===a[0]&&207===a[1]&&17===a[2]&&224===a[3]&&161===a[4]&&177===a[5]&&26===a[6]&&225===a[7]){if(236===a[512]&&165===a[513]&&193===a[514]&&0===a[515])return"application/msword";if(0===a[512]&&110===a[513]&&30===a[514]&&240===a[515]||15===a[512]&&0===a[513]&&232===a[514]&&3===a[515]||160===a[512]&&70===a[513]&&29===a[514]&&240===a[515])return"application/mspowerpoint";if(9===a[512]&&8===a[513]&&16===a[514]&&0===a[515]&&0===a[516]&&6===a[517]&&5===a[518]&&0===a[519]||253===a[512]&&255===a[513]&&255===a[514]&&255===a[515]&&32===a[516]&&0===a[517]&&0===a[518]&&0===a[519])return"application/excel"}else if(80===a[0]&&75===a[1]&&3===a[2]&&4===a[3]){var d=OOXMLReader.getFileType(a);if(d===OOXMLReader.DOCX)return"application/vnd.openxmlformats-officedocument.wordprocessingml.document";if(d===OOXMLReader.PPTX)return"application/vnd.openxmlformats-officedocument.presentationml.presentation";if(d===OOXMLReader.XLSX)return"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}return EDAM_MIME_TYPE_DEFAULT}function p(){var a=new Thrift.BinaryHttpTransport(G),b=new Thrift.BinaryProtocol(a);v=new NoteStoreClient(b)}function q(a,b){for(var c=decodeURIComponent(a).split("&")[0],d=window.atob(c),e=new Uint8Array(2*d.length),f=0;f<d.length;f++)e[f]=d.charCodeAt(f);g(e,b)}function r(a,b){if(a=GlobalUtils.unescapeXML(a),B++,EDGE&&f&&f.url.indexOf("mail.google.com")!==-1)Browser.sendToTab(f,{name:"getGmailAttachment",url:a},function(c){if(c.success){for(var d=new Uint8Array(c.data.length),e=0;e<c.data.length;e++)d[e]=c.data.charCodeAt(e);b.hasAttribute("evernote_attachment_url")?g(d,b,a,b.getAttribute("evernote_attachment_name"),!0):g(d,b,a)}C++,u()});else{var c=new XMLHttpRequest;c.open("GET",a),c.responseType="arraybuffer",c.onreadystatechange=function(a,b){return function(){4===this.readyState&&(200===this.status&&this.response&&this.response.byteLength>0?b.hasAttribute("evernote_attachment_url")?g(new Uint8Array(this.response),b,a,b.getAttribute("evernote_attachment_name"),!0):g(new Uint8Array(this.response),b,a):("embed"===b.nodeName.toLowerCase()||b.hasAttribute("evernote_attachment_url"))&&t(b),C++,u())}}(a,b);try{c.send()}catch(d){}}}function s(a,b){a.bytes.length=a.byteLength,g(new Uint8Array(a.bytes),b,D.attributes.sourceURL)}function t(a){a.parentNode.removeChild(a)}function u(){if(A&&B===C){var a=new XMLSerializer;if(D.content=a.serializeToString(E),EDGE&&(D.content='<?xml version="1.0" encoding="utf-8"?>'+D.content,D.content=D.content.replace(/xmlns:xml="[^"]+"/g,""),D.content=D.content.replace(/xmlns:xml='[^']+'/g,"")),D.content.length>EDAM_NOTE_CONTENT_LEN_MAX){var c=new EDAMUserException;return c.errorCode=EDAMErrorCode.BAD_DATA_FORMAT,c.parameter="Note.content",void k(c)}if(z+=D.content.length,z>b.noteSizeMax){var c=new EDAMUserException;return c.errorCode=EDAMErrorCode.LIMIT_REACHED,c.parameter="Note.size",void k(c)}if(e||d({name:"showSyncing"}),"noteSizeExceeded"===extension.getOption("simulateClippingError")){var c=new EDAMUserException;c.errorCode=EDAMErrorCode.LIMIT_REACHED,c.parameter="Note.size",k(c)}else if("overQuota"===extension.getOption("simulateClippingError")){var c=new EDAMUserException;c.errorCode=EDAMErrorCode.QUOTA_REACHED,c.parameter="Accounting.uploadLimit",k(c)}else if("overAccountMax"===extension.getOption("simulateClippingError")){var c=new EDAMUserException;c.errorCode=EDAMErrorCode.LIMIT_REACHED,c.parameter="Note",k(c)}else v.createNote(F,D,l,k)}}var v,w,x,y,z=0,A=!1,B=0,C=0,D=new Note,E=null,F=a.submit,G=a.noteStoreUrl,H=/^data:[^,]+,(.+)/i,I=/^resource:(.+)/i,J=["style","title","lang","xml:lang","dir","height","width","usemap","align","border","hspace","vspace","longdesc","alt"];this.createNoteWithThrift=j,Object.preventExtensions(this),p()}Object.preventExtensions(Submitter);