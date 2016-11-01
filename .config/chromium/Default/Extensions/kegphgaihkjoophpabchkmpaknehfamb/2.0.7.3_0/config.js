var Config = {
  //**** PRODUCTION *****
  environment: "prod",
  domain: "https://couponfollow.com/",
  useCache: true,
  dumpLogs: false,
  delayBeforeShowingFeedbackFooterAgain: 7200 // 5 days (in minutes)
  //*/

  /**** DEVELOPMENT *****
  environment: "dev",
  domain: "https://couponfollow.com/",
  useCache: false,
  dumpLogs: true,
  delayBeforeShowingFeedbackFooterAgain: 2 // in minutes
  //*/
};

Config.apiBase = Config.domain + "api/Extension";

// need to export in case of firefox so it can be accessed in other files
if (typeof exports !== "undefined") {
  exports.Config = Config;
}
