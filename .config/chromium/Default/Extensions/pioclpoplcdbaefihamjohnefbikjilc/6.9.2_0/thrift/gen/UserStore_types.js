/*! Copyright 2009-2016 Evernote Corporation. All rights reserved. */
EDAM_VERSION_MAJOR=1,EDAM_VERSION_MINOR=28,PublicUserInfo=function(a){this.userId=null,this.shardId=null,this.privilege=null,this.username=null,this.noteStoreUrl=null,this.webApiUrlPrefix=null,a&&(void 0!==a.userId&&(this.userId=a.userId),void 0!==a.shardId&&(this.shardId=a.shardId),void 0!==a.privilege&&(this.privilege=a.privilege),void 0!==a.username&&(this.username=a.username),void 0!==a.noteStoreUrl&&(this.noteStoreUrl=a.noteStoreUrl),void 0!==a.webApiUrlPrefix&&(this.webApiUrlPrefix=a.webApiUrlPrefix))},PublicUserInfo.prototype={},PublicUserInfo.prototype.read=function(a){for(a.readStructBegin();;){var b=a.readFieldBegin(),c=(b.fname,b.ftype),d=b.fid;if(c==Thrift.Type.STOP)break;switch(d){case 1:c==Thrift.Type.I32?this.userId=a.readI32().value:a.skip(c);break;case 2:c==Thrift.Type.STRING?this.shardId=a.readString().value:a.skip(c);break;case 3:c==Thrift.Type.I32?this.privilege=a.readI32().value:a.skip(c);break;case 4:c==Thrift.Type.STRING?this.username=a.readString().value:a.skip(c);break;case 5:c==Thrift.Type.STRING?this.noteStoreUrl=a.readString().value:a.skip(c);break;case 6:c==Thrift.Type.STRING?this.webApiUrlPrefix=a.readString().value:a.skip(c);break;default:a.skip(c)}a.readFieldEnd()}a.readStructEnd()},PublicUserInfo.prototype.write=function(a){a.writeStructBegin("PublicUserInfo"),null!==this.userId&&void 0!==this.userId&&(a.writeFieldBegin("userId",Thrift.Type.I32,1),a.writeI32(this.userId),a.writeFieldEnd()),null!==this.shardId&&void 0!==this.shardId&&(a.writeFieldBegin("shardId",Thrift.Type.STRING,2),a.writeString(this.shardId),a.writeFieldEnd()),null!==this.privilege&&void 0!==this.privilege&&(a.writeFieldBegin("privilege",Thrift.Type.I32,3),a.writeI32(this.privilege),a.writeFieldEnd()),null!==this.username&&void 0!==this.username&&(a.writeFieldBegin("username",Thrift.Type.STRING,4),a.writeString(this.username),a.writeFieldEnd()),null!==this.noteStoreUrl&&void 0!==this.noteStoreUrl&&(a.writeFieldBegin("noteStoreUrl",Thrift.Type.STRING,5),a.writeString(this.noteStoreUrl),a.writeFieldEnd()),null!==this.webApiUrlPrefix&&void 0!==this.webApiUrlPrefix&&(a.writeFieldBegin("webApiUrlPrefix",Thrift.Type.STRING,6),a.writeString(this.webApiUrlPrefix),a.writeFieldEnd()),a.writeFieldStop(),a.writeStructEnd()},UserUrls=function(a){this.noteStoreUrl=null,this.webApiUrlPrefix=null,this.userStoreUrl=null,this.utilityUrl=null,this.messageStoreUrl=null,this.userWebSocketUrl=null,a&&(void 0!==a.noteStoreUrl&&(this.noteStoreUrl=a.noteStoreUrl),void 0!==a.webApiUrlPrefix&&(this.webApiUrlPrefix=a.webApiUrlPrefix),void 0!==a.userStoreUrl&&(this.userStoreUrl=a.userStoreUrl),void 0!==a.utilityUrl&&(this.utilityUrl=a.utilityUrl),void 0!==a.messageStoreUrl&&(this.messageStoreUrl=a.messageStoreUrl),void 0!==a.userWebSocketUrl&&(this.userWebSocketUrl=a.userWebSocketUrl))},UserUrls.prototype={},UserUrls.prototype.read=function(a){for(a.readStructBegin();;){var b=a.readFieldBegin(),c=(b.fname,b.ftype),d=b.fid;if(c==Thrift.Type.STOP)break;switch(d){case 1:c==Thrift.Type.STRING?this.noteStoreUrl=a.readString().value:a.skip(c);break;case 2:c==Thrift.Type.STRING?this.webApiUrlPrefix=a.readString().value:a.skip(c);break;case 3:c==Thrift.Type.STRING?this.userStoreUrl=a.readString().value:a.skip(c);break;case 4:c==Thrift.Type.STRING?this.utilityUrl=a.readString().value:a.skip(c);break;case 5:c==Thrift.Type.STRING?this.messageStoreUrl=a.readString().value:a.skip(c);break;case 6:c==Thrift.Type.STRING?this.userWebSocketUrl=a.readString().value:a.skip(c);break;default:a.skip(c)}a.readFieldEnd()}a.readStructEnd()},UserUrls.prototype.write=function(a){a.writeStructBegin("UserUrls"),null!==this.noteStoreUrl&&void 0!==this.noteStoreUrl&&(a.writeFieldBegin("noteStoreUrl",Thrift.Type.STRING,1),a.writeString(this.noteStoreUrl),a.writeFieldEnd()),null!==this.webApiUrlPrefix&&void 0!==this.webApiUrlPrefix&&(a.writeFieldBegin("webApiUrlPrefix",Thrift.Type.STRING,2),a.writeString(this.webApiUrlPrefix),a.writeFieldEnd()),null!==this.userStoreUrl&&void 0!==this.userStoreUrl&&(a.writeFieldBegin("userStoreUrl",Thrift.Type.STRING,3),a.writeString(this.userStoreUrl),a.writeFieldEnd()),null!==this.utilityUrl&&void 0!==this.utilityUrl&&(a.writeFieldBegin("utilityUrl",Thrift.Type.STRING,4),a.writeString(this.utilityUrl),a.writeFieldEnd()),null!==this.messageStoreUrl&&void 0!==this.messageStoreUrl&&(a.writeFieldBegin("messageStoreUrl",Thrift.Type.STRING,5),a.writeString(this.messageStoreUrl),a.writeFieldEnd()),null!==this.userWebSocketUrl&&void 0!==this.userWebSocketUrl&&(a.writeFieldBegin("userWebSocketUrl",Thrift.Type.STRING,6),a.writeString(this.userWebSocketUrl),a.writeFieldEnd()),a.writeFieldStop(),a.writeStructEnd()},AuthenticationResult=function(a){this.currentTime=null,this.authenticationToken=null,this.expiration=null,this.user=null,this.publicUserInfo=null,this.noteStoreUrl=null,this.webApiUrlPrefix=null,this.secondFactorRequired=null,this.secondFactorDeliveryHint=null,this.urls=null,a&&(void 0!==a.currentTime&&(this.currentTime=a.currentTime),void 0!==a.authenticationToken&&(this.authenticationToken=a.authenticationToken),void 0!==a.expiration&&(this.expiration=a.expiration),void 0!==a.user&&(this.user=a.user),void 0!==a.publicUserInfo&&(this.publicUserInfo=a.publicUserInfo),void 0!==a.noteStoreUrl&&(this.noteStoreUrl=a.noteStoreUrl),void 0!==a.webApiUrlPrefix&&(this.webApiUrlPrefix=a.webApiUrlPrefix),void 0!==a.secondFactorRequired&&(this.secondFactorRequired=a.secondFactorRequired),void 0!==a.secondFactorDeliveryHint&&(this.secondFactorDeliveryHint=a.secondFactorDeliveryHint),void 0!==a.urls&&(this.urls=a.urls))},AuthenticationResult.prototype={},AuthenticationResult.prototype.read=function(a){for(a.readStructBegin();;){var b=a.readFieldBegin(),c=(b.fname,b.ftype),d=b.fid;if(c==Thrift.Type.STOP)break;switch(d){case 1:c==Thrift.Type.I64?this.currentTime=a.readI64().value:a.skip(c);break;case 2:c==Thrift.Type.STRING?this.authenticationToken=a.readString().value:a.skip(c);break;case 3:c==Thrift.Type.I64?this.expiration=a.readI64().value:a.skip(c);break;case 4:c==Thrift.Type.STRUCT?(this.user=new User,this.user.read(a)):a.skip(c);break;case 5:c==Thrift.Type.STRUCT?(this.publicUserInfo=new PublicUserInfo,this.publicUserInfo.read(a)):a.skip(c);break;case 6:c==Thrift.Type.STRING?this.noteStoreUrl=a.readString().value:a.skip(c);break;case 7:c==Thrift.Type.STRING?this.webApiUrlPrefix=a.readString().value:a.skip(c);break;case 8:c==Thrift.Type.BOOL?this.secondFactorRequired=a.readBool().value:a.skip(c);break;case 9:c==Thrift.Type.STRING?this.secondFactorDeliveryHint=a.readString().value:a.skip(c);break;case 10:c==Thrift.Type.STRUCT?(this.urls=new UserUrls,this.urls.read(a)):a.skip(c);break;default:a.skip(c)}a.readFieldEnd()}a.readStructEnd()},AuthenticationResult.prototype.write=function(a){a.writeStructBegin("AuthenticationResult"),null!==this.currentTime&&void 0!==this.currentTime&&(a.writeFieldBegin("currentTime",Thrift.Type.I64,1),a.writeI64(this.currentTime),a.writeFieldEnd()),null!==this.authenticationToken&&void 0!==this.authenticationToken&&(a.writeFieldBegin("authenticationToken",Thrift.Type.STRING,2),a.writeString(this.authenticationToken),a.writeFieldEnd()),null!==this.expiration&&void 0!==this.expiration&&(a.writeFieldBegin("expiration",Thrift.Type.I64,3),a.writeI64(this.expiration),a.writeFieldEnd()),null!==this.user&&void 0!==this.user&&(a.writeFieldBegin("user",Thrift.Type.STRUCT,4),this.user.write(a),a.writeFieldEnd()),null!==this.publicUserInfo&&void 0!==this.publicUserInfo&&(a.writeFieldBegin("publicUserInfo",Thrift.Type.STRUCT,5),this.publicUserInfo.write(a),a.writeFieldEnd()),null!==this.noteStoreUrl&&void 0!==this.noteStoreUrl&&(a.writeFieldBegin("noteStoreUrl",Thrift.Type.STRING,6),a.writeString(this.noteStoreUrl),a.writeFieldEnd()),null!==this.webApiUrlPrefix&&void 0!==this.webApiUrlPrefix&&(a.writeFieldBegin("webApiUrlPrefix",Thrift.Type.STRING,7),a.writeString(this.webApiUrlPrefix),a.writeFieldEnd()),null!==this.secondFactorRequired&&void 0!==this.secondFactorRequired&&(a.writeFieldBegin("secondFactorRequired",Thrift.Type.BOOL,8),a.writeBool(this.secondFactorRequired),a.writeFieldEnd()),null!==this.secondFactorDeliveryHint&&void 0!==this.secondFactorDeliveryHint&&(a.writeFieldBegin("secondFactorDeliveryHint",Thrift.Type.STRING,9),a.writeString(this.secondFactorDeliveryHint),a.writeFieldEnd()),null!==this.urls&&void 0!==this.urls&&(a.writeFieldBegin("urls",Thrift.Type.STRUCT,10),this.urls.write(a),a.writeFieldEnd()),a.writeFieldStop(),a.writeStructEnd()},BootstrapSettings=function(a){this.serviceHost=null,this.marketingUrl=null,this.supportUrl=null,this.accountEmailDomain=null,this.cardscanUrl=null,this.announcementsUrl=null,this.enableFacebookSharing=null,this.enableGiftSubscriptions=null,this.enableSupportTickets=null,this.enableSharedNotebooks=null,this.enableSingleNoteSharing=null,this.enableSponsoredAccounts=null,this.enableTwitterSharing=null,this.enableLinkedInSharing=null,this.enablePublicNotebooks=null,this.enableGoogle=null,a&&(void 0!==a.serviceHost&&(this.serviceHost=a.serviceHost),void 0!==a.marketingUrl&&(this.marketingUrl=a.marketingUrl),void 0!==a.supportUrl&&(this.supportUrl=a.supportUrl),void 0!==a.accountEmailDomain&&(this.accountEmailDomain=a.accountEmailDomain),void 0!==a.cardscanUrl&&(this.cardscanUrl=a.cardscanUrl),void 0!==a.announcementsUrl&&(this.announcementsUrl=a.announcementsUrl),void 0!==a.enableFacebookSharing&&(this.enableFacebookSharing=a.enableFacebookSharing),void 0!==a.enableGiftSubscriptions&&(this.enableGiftSubscriptions=a.enableGiftSubscriptions),void 0!==a.enableSupportTickets&&(this.enableSupportTickets=a.enableSupportTickets),void 0!==a.enableSharedNotebooks&&(this.enableSharedNotebooks=a.enableSharedNotebooks),void 0!==a.enableSingleNoteSharing&&(this.enableSingleNoteSharing=a.enableSingleNoteSharing),void 0!==a.enableSponsoredAccounts&&(this.enableSponsoredAccounts=a.enableSponsoredAccounts),void 0!==a.enableTwitterSharing&&(this.enableTwitterSharing=a.enableTwitterSharing),void 0!==a.enableLinkedInSharing&&(this.enableLinkedInSharing=a.enableLinkedInSharing),void 0!==a.enablePublicNotebooks&&(this.enablePublicNotebooks=a.enablePublicNotebooks),void 0!==a.enableGoogle&&(this.enableGoogle=a.enableGoogle))},BootstrapSettings.prototype={},BootstrapSettings.prototype.read=function(a){for(a.readStructBegin();;){var b=a.readFieldBegin(),c=(b.fname,b.ftype),d=b.fid;if(c==Thrift.Type.STOP)break;switch(d){case 1:c==Thrift.Type.STRING?this.serviceHost=a.readString().value:a.skip(c);break;case 2:c==Thrift.Type.STRING?this.marketingUrl=a.readString().value:a.skip(c);break;case 3:c==Thrift.Type.STRING?this.supportUrl=a.readString().value:a.skip(c);break;case 4:c==Thrift.Type.STRING?this.accountEmailDomain=a.readString().value:a.skip(c);break;case 14:c==Thrift.Type.STRING?this.cardscanUrl=a.readString().value:a.skip(c);break;case 15:c==Thrift.Type.STRING?this.announcementsUrl=a.readString().value:a.skip(c);break;case 5:c==Thrift.Type.BOOL?this.enableFacebookSharing=a.readBool().value:a.skip(c);break;case 6:c==Thrift.Type.BOOL?this.enableGiftSubscriptions=a.readBool().value:a.skip(c);break;case 7:c==Thrift.Type.BOOL?this.enableSupportTickets=a.readBool().value:a.skip(c);break;case 8:c==Thrift.Type.BOOL?this.enableSharedNotebooks=a.readBool().value:a.skip(c);break;case 9:c==Thrift.Type.BOOL?this.enableSingleNoteSharing=a.readBool().value:a.skip(c);break;case 10:c==Thrift.Type.BOOL?this.enableSponsoredAccounts=a.readBool().value:a.skip(c);break;case 11:c==Thrift.Type.BOOL?this.enableTwitterSharing=a.readBool().value:a.skip(c);break;case 12:c==Thrift.Type.BOOL?this.enableLinkedInSharing=a.readBool().value:a.skip(c);break;case 13:c==Thrift.Type.BOOL?this.enablePublicNotebooks=a.readBool().value:a.skip(c);break;case 16:c==Thrift.Type.BOOL?this.enableGoogle=a.readBool().value:a.skip(c);break;default:a.skip(c)}a.readFieldEnd()}a.readStructEnd()},BootstrapSettings.prototype.write=function(a){a.writeStructBegin("BootstrapSettings"),null!==this.serviceHost&&void 0!==this.serviceHost&&(a.writeFieldBegin("serviceHost",Thrift.Type.STRING,1),a.writeString(this.serviceHost),a.writeFieldEnd()),null!==this.marketingUrl&&void 0!==this.marketingUrl&&(a.writeFieldBegin("marketingUrl",Thrift.Type.STRING,2),a.writeString(this.marketingUrl),a.writeFieldEnd()),null!==this.supportUrl&&void 0!==this.supportUrl&&(a.writeFieldBegin("supportUrl",Thrift.Type.STRING,3),a.writeString(this.supportUrl),a.writeFieldEnd()),null!==this.accountEmailDomain&&void 0!==this.accountEmailDomain&&(a.writeFieldBegin("accountEmailDomain",Thrift.Type.STRING,4),a.writeString(this.accountEmailDomain),a.writeFieldEnd()),null!==this.cardscanUrl&&void 0!==this.cardscanUrl&&(a.writeFieldBegin("cardscanUrl",Thrift.Type.STRING,14),a.writeString(this.cardscanUrl),a.writeFieldEnd()),null!==this.announcementsUrl&&void 0!==this.announcementsUrl&&(a.writeFieldBegin("announcementsUrl",Thrift.Type.STRING,15),a.writeString(this.announcementsUrl),a.writeFieldEnd()),null!==this.enableFacebookSharing&&void 0!==this.enableFacebookSharing&&(a.writeFieldBegin("enableFacebookSharing",Thrift.Type.BOOL,5),a.writeBool(this.enableFacebookSharing),a.writeFieldEnd()),null!==this.enableGiftSubscriptions&&void 0!==this.enableGiftSubscriptions&&(a.writeFieldBegin("enableGiftSubscriptions",Thrift.Type.BOOL,6),a.writeBool(this.enableGiftSubscriptions),a.writeFieldEnd()),null!==this.enableSupportTickets&&void 0!==this.enableSupportTickets&&(a.writeFieldBegin("enableSupportTickets",Thrift.Type.BOOL,7),a.writeBool(this.enableSupportTickets),a.writeFieldEnd()),null!==this.enableSharedNotebooks&&void 0!==this.enableSharedNotebooks&&(a.writeFieldBegin("enableSharedNotebooks",Thrift.Type.BOOL,8),a.writeBool(this.enableSharedNotebooks),a.writeFieldEnd()),null!==this.enableSingleNoteSharing&&void 0!==this.enableSingleNoteSharing&&(a.writeFieldBegin("enableSingleNoteSharing",Thrift.Type.BOOL,9),a.writeBool(this.enableSingleNoteSharing),a.writeFieldEnd()),null!==this.enableSponsoredAccounts&&void 0!==this.enableSponsoredAccounts&&(a.writeFieldBegin("enableSponsoredAccounts",Thrift.Type.BOOL,10),a.writeBool(this.enableSponsoredAccounts),a.writeFieldEnd()),null!==this.enableTwitterSharing&&void 0!==this.enableTwitterSharing&&(a.writeFieldBegin("enableTwitterSharing",Thrift.Type.BOOL,11),a.writeBool(this.enableTwitterSharing),a.writeFieldEnd()),null!==this.enableLinkedInSharing&&void 0!==this.enableLinkedInSharing&&(a.writeFieldBegin("enableLinkedInSharing",Thrift.Type.BOOL,12),a.writeBool(this.enableLinkedInSharing),a.writeFieldEnd()),null!==this.enablePublicNotebooks&&void 0!==this.enablePublicNotebooks&&(a.writeFieldBegin("enablePublicNotebooks",Thrift.Type.BOOL,13),a.writeBool(this.enablePublicNotebooks),a.writeFieldEnd()),null!==this.enableGoogle&&void 0!==this.enableGoogle&&(a.writeFieldBegin("enableGoogle",Thrift.Type.BOOL,16),a.writeBool(this.enableGoogle),a.writeFieldEnd()),a.writeFieldStop(),a.writeStructEnd()},PushNotificationCredentials=function(a){this.iosDeviceToken=null,this.gcmRegistrationId=null,a&&(void 0!==a.iosDeviceToken&&(this.iosDeviceToken=a.iosDeviceToken),void 0!==a.gcmRegistrationId&&(this.gcmRegistrationId=a.gcmRegistrationId))},PushNotificationCredentials.prototype={},PushNotificationCredentials.prototype.read=function(a){for(a.readStructBegin();;){var b=a.readFieldBegin(),c=(b.fname,b.ftype),d=b.fid;if(c==Thrift.Type.STOP)break;switch(d){case 1:c==Thrift.Type.STRING?this.iosDeviceToken=a.readBinary().value:a.skip(c);break;case 2:c==Thrift.Type.STRING?this.gcmRegistrationId=a.readString().value:a.skip(c);break;default:a.skip(c)}a.readFieldEnd()}a.readStructEnd()},PushNotificationCredentials.prototype.write=function(a){a.writeStructBegin("PushNotificationCredentials"),null!==this.iosDeviceToken&&void 0!==this.iosDeviceToken&&(a.writeFieldBegin("iosDeviceToken",Thrift.Type.STRING,1),a.writeBinary(this.iosDeviceToken),a.writeFieldEnd()),null!==this.gcmRegistrationId&&void 0!==this.gcmRegistrationId&&(a.writeFieldBegin("gcmRegistrationId",Thrift.Type.STRING,2),a.writeString(this.gcmRegistrationId),a.writeFieldEnd()),a.writeFieldStop(),a.writeStructEnd()},RegisterForSyncPushNotificationsResult=function(a){this.sharedSecret=null,a&&void 0!==a.sharedSecret&&(this.sharedSecret=a.sharedSecret)},RegisterForSyncPushNotificationsResult.prototype={},RegisterForSyncPushNotificationsResult.prototype.read=function(a){for(a.readStructBegin();;){var b=a.readFieldBegin(),c=(b.fname,b.ftype),d=b.fid;if(c==Thrift.Type.STOP)break;switch(d){case 1:c==Thrift.Type.STRING?this.sharedSecret=a.readBinary().value:a.skip(c);break;case 0:a.skip(c);break;default:a.skip(c)}a.readFieldEnd()}a.readStructEnd()},RegisterForSyncPushNotificationsResult.prototype.write=function(a){a.writeStructBegin("RegisterForSyncPushNotificationsResult"),null!==this.sharedSecret&&void 0!==this.sharedSecret&&(a.writeFieldBegin("sharedSecret",Thrift.Type.STRING,1),a.writeBinary(this.sharedSecret),a.writeFieldEnd()),a.writeFieldStop(),a.writeStructEnd()};