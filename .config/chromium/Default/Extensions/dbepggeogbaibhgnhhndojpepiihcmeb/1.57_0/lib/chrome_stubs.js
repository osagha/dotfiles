// Generated by CoffeeScript 1.9.3
(function() {
  if (window.chrome == null) {
    window.chrome = {
      runtime: {
        connect: function() {
          return {
            onMessage: {
              addListener: function() {}
            },
            onDisconnect: {
              addListener: function() {}
            },
            postMessage: function() {}
          };
        },
        onMessage: {
          addListener: function() {}
        },
        sendMessage: function() {},
        getManifest: function() {
          return {
            version: "1.51"
          };
        },
        getURL: function(url) {
          return "../../" + url;
        }
      },
      storage: {
        local: {
          get: function() {},
          set: function() {}
        },
        sync: {
          get: function(_, callback) {
            return typeof callback === "function" ? callback({}) : void 0;
          },
          set: function() {}
        },
        onChanged: {
          addListener: function() {}
        }
      },
      extension: {
        inIncognitoContext: false,
        getURL: function(url) {
          return chrome.runtime.getURL(url);
        }
      }
    };
  }

}).call(this);
