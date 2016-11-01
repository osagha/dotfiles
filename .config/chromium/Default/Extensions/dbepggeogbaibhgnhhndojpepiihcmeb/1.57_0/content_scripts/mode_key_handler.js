// Generated by CoffeeScript 1.9.3
(function() {
  var KeyHandlerMode, root,
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  KeyHandlerMode = (function(superClass) {
    extend1(KeyHandlerMode, superClass);

    KeyHandlerMode.prototype.keydownEvents = {};

    KeyHandlerMode.prototype.setKeyMapping = function(keyMapping) {
      this.keyMapping = keyMapping;
      return this.reset();
    };

    KeyHandlerMode.prototype.setPassKeys = function(passKeys) {
      this.passKeys = passKeys;
      return this.reset();
    };

    KeyHandlerMode.prototype.setCommandHandler = function(commandHandler) {
      this.commandHandler = commandHandler;
    };

    KeyHandlerMode.prototype.reset = function(countPrefix) {
      this.countPrefix = countPrefix != null ? countPrefix : 0;
      bgLog("Clearing key state: " + this.countPrefix + " (" + this.name + ")");
      return this.keyState = [this.keyMapping];
    };

    function KeyHandlerMode(options) {
      var ref, ref1;
      this.commandHandler = (ref = options.commandHandler) != null ? ref : (function() {});
      this.setKeyMapping((ref1 = options.keyMapping) != null ? ref1 : {});
      KeyHandlerMode.__super__.constructor.call(this, extend(options, {
        keydown: this.onKeydown.bind(this),
        keypress: this.onKeypress.bind(this),
        keyup: this.onKeyup.bind(this),
        blur: (function(_this) {
          return function(event) {
            return _this.alwaysContinueBubbling(function() {
              if (event.target === window) {
                return _this.keydownEvents = {};
              }
            });
          };
        })(this)
      }));
    }

    KeyHandlerMode.prototype.onKeydown = function(event) {
      var isEscape, keyChar;
      keyChar = KeyboardUtils.getKeyCharString(event);
      isEscape = KeyboardUtils.isEscape(event);
      if (isEscape && (this.countPrefix !== 0 || this.keyState.length !== 1)) {
        this.keydownEvents[event.keyCode] = true;
        this.reset();
        return this.suppressEvent;
      } else if (isEscape && (typeof HelpDialog !== "undefined" && HelpDialog !== null ? HelpDialog.isShowing() : void 0)) {
        this.keydownEvents[event.keyCode] = true;
        HelpDialog.toggle();
        return this.suppressEvent;
      } else if (isEscape) {
        return this.continueBubbling;
      } else if (this.isMappedKey(keyChar)) {
        this.keydownEvents[event.keyCode] = true;
        return this.handleKeyChar(keyChar);
      } else if (!keyChar && (keyChar = KeyboardUtils.getKeyChar(event)) && (this.isMappedKey(keyChar) || this.isCountKey(keyChar))) {
        this.keydownEvents[event.keyCode] = true;
        return this.suppressPropagation;
      } else {
        return this.continueBubbling;
      }
    };

    KeyHandlerMode.prototype.onKeypress = function(event) {
      var digit, keyChar;
      keyChar = KeyboardUtils.getKeyCharString(event);
      if (this.isMappedKey(keyChar)) {
        return this.handleKeyChar(keyChar);
      } else if (this.isCountKey(keyChar)) {
        digit = parseInt(keyChar);
        this.reset(this.keyState.length === 1 ? this.countPrefix * 10 + digit : digit);
        return this.suppressEvent;
      } else {
        this.reset();
        return this.continueBubbling;
      }
    };

    KeyHandlerMode.prototype.onKeyup = function(event) {
      if (!(event.keyCode in this.keydownEvents)) {
        return this.continueBubbling;
      }
      delete this.keydownEvents[event.keyCode];
      return this.suppressPropagation;
    };

    KeyHandlerMode.prototype.isMappedKey = function(keyChar) {
      var mapping;
      return (((function() {
        var i, len, ref, results;
        ref = this.keyState;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          mapping = ref[i];
          if (keyChar in mapping) {
            results.push(mapping);
          }
        }
        return results;
      }).call(this))[0] != null) && !this.isPassKey(keyChar);
    };

    KeyHandlerMode.prototype.isCountKey = function(keyChar) {
      return keyChar && ((0 < this.countPrefix ? '0' : '1') <= keyChar && keyChar <= '9') && !this.isPassKey(keyChar);
    };

    KeyHandlerMode.prototype.isPassKey = function(keyChar) {
      var ref;
      return this.countPrefix === 0 && this.keyState.length === 1 && indexOf.call((ref = this.passKeys) != null ? ref : "", keyChar) >= 0;
    };

    KeyHandlerMode.prototype.handleKeyChar = function(keyChar) {
      var command, count, mapping;
      bgLog("Handle key " + keyChar + " (" + this.name + ")");
      if (!(keyChar in this.keyState[0])) {
        this.countPrefix = 0;
      }
      this.keyState = slice.call((function() {
          var i, len, ref, results;
          ref = this.keyState;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            mapping = ref[i];
            if (keyChar in mapping) {
              results.push(mapping[keyChar]);
            }
          }
          return results;
        }).call(this)).concat([this.keyMapping]);
      if (this.keyState[0].command != null) {
        command = this.keyState[0];
        count = 0 < this.countPrefix ? this.countPrefix : 1;
        bgLog("Call " + command.command + "[" + count + "] (" + this.name + ")");
        this.reset();
        this.commandHandler({
          command: command,
          count: count
        });
      }
      return this.suppressEvent;
    };

    return KeyHandlerMode;

  })(Mode);

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  root.KeyHandlerMode = KeyHandlerMode;

}).call(this);