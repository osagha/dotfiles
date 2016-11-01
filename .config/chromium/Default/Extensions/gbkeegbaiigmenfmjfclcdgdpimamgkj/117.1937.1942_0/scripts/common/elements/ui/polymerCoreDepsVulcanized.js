(function() {

    // monostate data
    var metaDatas = {};
    var metaArrays = {};

    Polymer.IronMeta = Polymer({

      is: 'iron-meta',

      properties: {

        /**
         * The type of meta-data.  All meta-data of the same type is stored
         * together.
         */
        type: {
          type: String,
          value: 'default',
          observer: '_typeChanged'
        },

        /**
         * The key used to store `value` under the `type` namespace.
         */
        key: {
          type: String,
          observer: '_keyChanged'
        },

        /**
         * The meta-data to store or retrieve.
         */
        value: {
          type: Object,
          notify: true,
          observer: '_valueChanged'
        },

        /**
         * If true, `value` is set to the iron-meta instance itself.
         */
         self: {
          type: Boolean,
          observer: '_selfChanged'
        },

        /**
         * Array of all meta-data values for the given type.
         */
        list: {
          type: Array,
          notify: true
        }

      },

      /**
       * Only runs if someone invokes the factory/constructor directly
       * e.g. `new Polymer.IronMeta()`
       */
      factoryImpl: function(config) {
        if (config) {
          for (var n in config) {
            switch(n) {
              case 'type':
              case 'key':
              case 'value':
                this[n] = config[n];
                break;
            }
          }
        }
      },

      created: function() {
        // TODO(sjmiles): good for debugging?
        this._metaDatas = metaDatas;
        this._metaArrays = metaArrays;
      },

      _keyChanged: function(key, old) {
        this._resetRegistration(old);
      },

      _valueChanged: function(value) {
        this._resetRegistration(this.key);
      },

      _selfChanged: function(self) {
        if (self) {
          this.value = this;
        }
      },

      _typeChanged: function(type) {
        this._unregisterKey(this.key);
        if (!metaDatas[type]) {
          metaDatas[type] = {};
        }
        this._metaData = metaDatas[type];
        if (!metaArrays[type]) {
          metaArrays[type] = [];
        }
        this.list = metaArrays[type];
        this._registerKeyValue(this.key, this.value);
      },

      /**
       * Retrieves meta data value by key.
       *
       * @method byKey
       * @param {string} key The key of the meta-data to be returned.
       * @return {*}
       */
      byKey: function(key) {
        return this._metaData && this._metaData[key];
      },

      _resetRegistration: function(oldKey) {
        this._unregisterKey(oldKey);
        this._registerKeyValue(this.key, this.value);
      },

      _unregisterKey: function(key) {
        this._unregister(key, this._metaData, this.list);
      },

      _registerKeyValue: function(key, value) {
        this._register(key, value, this._metaData, this.list);
      },

      _register: function(key, value, data, list) {
        if (key && data && value !== undefined) {
          data[key] = value;
          list.push(value);
        }
      },

      _unregister: function(key, data, list) {
        if (key && data) {
          if (key in data) {
            var value = data[key];
            delete data[key];
            this.arrayDelete(list, value);
          }
        }
      }

    });

    /**
    `iron-meta-query` can be used to access infomation stored in `iron-meta`.

    Examples:

    If I create an instance like this:

        <iron-meta key="info" value="foo/bar"></iron-meta>

    Note that value="foo/bar" is the metadata I've defined. I could define more
    attributes or use child nodes to define additional metadata.

    Now I can access that element (and it's metadata) from any `iron-meta-query` instance:

         var value = new Polymer.IronMetaQuery({key: 'info'}).value;

    @group Polymer Iron Elements
    @element iron-meta-query
    */
    Polymer.IronMetaQuery = Polymer({

      is: 'iron-meta-query',

      properties: {

        /**
         * The type of meta-data.  All meta-data of the same type is stored
         * together.
         */
        type: {
          type: String,
          value: 'default',
          observer: '_typeChanged'
        },

        /**
         * Specifies a key to use for retrieving `value` from the `type`
         * namespace.
         */
        key: {
          type: String,
          observer: '_keyChanged'
        },

        /**
         * The meta-data to store or retrieve.
         */
        value: {
          type: Object,
          notify: true,
          readOnly: true
        },

        /**
         * Array of all meta-data values for the given type.
         */
        list: {
          type: Array,
          notify: true
        }

      },

      /**
       * Actually a factory method, not a true constructor. Only runs if
       * someone invokes it directly (via `new Polymer.IronMeta()`);
       */
      factoryImpl: function(config) {
        if (config) {
          for (var n in config) {
            switch(n) {
              case 'type':
              case 'key':
                this[n] = config[n];
                break;
            }
          }
        }
      },

      created: function() {
        // TODO(sjmiles): good for debugging?
        this._metaDatas = metaDatas;
        this._metaArrays = metaArrays;
      },

      _keyChanged: function(key) {
        this._setValue(this._metaData && this._metaData[key]);
      },

      _typeChanged: function(type) {
        this._metaData = metaDatas[type];
        this.list = metaArrays[type];
        if (this.key) {
          this._keyChanged(this.key);
        }
      },

      /**
       * Retrieves meta data value by key.
       * @param {string} key The key of the meta-data to be returned.
       * @return {*}
       */
      byKey: function(key) {
        return this._metaData && this._metaData[key];
      }

    });

  })();
Polymer({

      is: 'iron-icon',

      properties: {

        /**
         * The name of the icon to use. The name should be of the form:
         * `iconset_name:icon_name`.
         */
        icon: {
          type: String,
          observer: '_iconChanged'
        },

        /**
         * The name of the theme to used, if one is specified by the
         * iconset.
         */
        theme: {
          type: String,
          observer: '_updateIcon'
        },

        /**
         * If using iron-icon without an iconset, you can set the src to be
         * the URL of an individual icon image file. Note that this will take
         * precedence over a given icon attribute.
         */
        src: {
          type: String,
          observer: '_srcChanged'
        },
        
        _meta: {
          value: Polymer.Base.create('iron-meta', {type: 'iconset'})
        }
        
      },

      _DEFAULT_ICONSET: 'icons',

      _iconChanged: function(icon) {
        var parts = (icon || '').split(':');
        this._iconName = parts.pop();
        this._iconsetName = parts.pop() || this._DEFAULT_ICONSET;
        this._updateIcon();
      },

      _srcChanged: function(src) {
        this._updateIcon();
      },

      _usesIconset: function() {
        return this.icon || !this.src;
      },

      /** @suppress {visibility} */
      _updateIcon: function() {
        if (this._usesIconset()) {
          if (this._iconsetName) {
            this._iconset = this._meta.byKey(this._iconsetName);
            if (this._iconset) {
              this._iconset.applyIcon(this, this._iconName, this.theme);
            } else {
              this._warn(this._logf('_updateIcon', 'could not find iconset `'
                + this._iconsetName + '`, did you import the iconset?'));
            }
          }
        } else {
          if (!this._img) {
            this._img = document.createElement('img');
            this._img.style.width = '100%';
            this._img.style.height = '100%';
            this._img.draggable = false;
          }
          this._img.src = this.src;
          Polymer.dom(this.root).appendChild(this._img);
        }
      }

    });
/** @polymerBehavior */
  Polymer.PaperSpinnerBehavior = {

    listeners: {
      'animationend': '__reset',
      'webkitAnimationEnd': '__reset'
    },

    properties: {
      /**
       * Displays the spinner.
       */
      active: {
        type: Boolean,
        value: false,
        reflectToAttribute: true,
        observer: '__activeChanged'
      },

      /**
       * Alternative text content for accessibility support.
       * If alt is present, it will add an aria-label whose content matches alt when active.
       * If alt is not present, it will default to 'loading' as the alt value.
       */
      alt: {
        type: String,
        value: 'loading',
        observer: '__altChanged'
      },

      __coolingDown: {
        type: Boolean,
        value: false
      }
    },

    __computeContainerClasses: function(active, coolingDown) {
      return [
        active || coolingDown ? 'active' : '',
        coolingDown ? 'cooldown' : ''
      ].join(' ');
    },

    __activeChanged: function(active, old) {
      this.__setAriaHidden(!active);
      this.__coolingDown = !active && old;
    },

    __altChanged: function(alt) {
      // user-provided `aria-label` takes precedence over prototype default
      if (alt === this.getPropertyInfo('alt').value) {
        this.alt = this.getAttribute('aria-label') || alt;
      } else {
        this.__setAriaHidden(alt==='');
        this.setAttribute('aria-label', alt);
      }
    },

    __setAriaHidden: function(hidden) {
      var attr = 'aria-hidden';
      if (hidden) {
        this.setAttribute(attr, 'true');
      } else {
        this.removeAttribute(attr);
      }
    },

    __reset: function() {
      this.active = false;
      this.__coolingDown = false;
    }
  };
Polymer({
      is: 'paper-spinner-lite',

      behaviors: [
        Polymer.PaperSpinnerBehavior
      ]
    });
(function() {
      'use strict';

      Polymer.IronA11yAnnouncer = Polymer({
        is: 'iron-a11y-announcer',

        properties: {

          /**
           * The value of mode is used to set the `aria-live` attribute
           * for the element that will be announced. Valid values are: `off`,
           * `polite` and `assertive`.
           */
          mode: {
            type: String,
            value: 'polite'
          },

          _text: {
            type: String,
            value: ''
          }
        },

        created: function() {
          if (!Polymer.IronA11yAnnouncer.instance) {
            Polymer.IronA11yAnnouncer.instance = this;
          }

          document.body.addEventListener('iron-announce', this._onIronAnnounce.bind(this));
        },

        /**
         * Cause a text string to be announced by screen readers.
         *
         * @param {string} text The text that should be announced.
         */
        announce: function(text) {
          this._text = '';
          this.async(function() {
            this._text = text;
          }, 100);
        },

        _onIronAnnounce: function(event) {
          if (event.detail && event.detail.text) {
            this.announce(event.detail.text);
          }
        }
      });

      Polymer.IronA11yAnnouncer.instance = null;

      Polymer.IronA11yAnnouncer.requestAvailability = function() {
        if (!Polymer.IronA11yAnnouncer.instance) {
          Polymer.IronA11yAnnouncer.instance = document.createElement('iron-a11y-announcer');
        }

        document.body.appendChild(Polymer.IronA11yAnnouncer.instance);
      };
    })();
(function() {

  var PaperToast = Polymer({
    is: 'paper-toast',

    properties: {
      /**
       * The duration in milliseconds to show the toast.
       */
      duration: {
        type: Number,
        value: 3000
      },

      /**
       * The text to display in the toast.
       */
      text: {
        type: String,
        value: ""
      },

      /**
       * True if the toast is currently visible.
       */
      visible: {
        type: Boolean,
        readOnly: true,
        value: false,
        observer: '_visibleChanged'
      }
    },

    created: function() {
      Polymer.IronA11yAnnouncer.requestAvailability();
    },

    ready: function() {
      this.async(function() {
        this.hide();
      });
    },

    /**
     * Show the toast.
     * @method show
     */
    show: function() {
      if (PaperToast.currentToast) {
        PaperToast.currentToast.hide();
      }
      PaperToast.currentToast = this;
      this.removeAttribute('aria-hidden');
      this._setVisible(true);
      this.fire('iron-announce', {
        text: this.text
      });
      this.debounce('hide', this.hide, this.duration);
    },

    /**
     * Hide the toast
     */
    hide: function() {
      this.setAttribute('aria-hidden', 'true');
      this._setVisible(false);
    },

    /**
     * Toggle the opened state of the toast.
     * @method toggle
     */
    toggle: function() {
      if (!this.visible) {
        this.show();
      } else {
        this.hide();
      }
    },

    _visibleChanged: function(visible) {
      this.toggleClass('paper-toast-open', visible);
    }
  });

  PaperToast.currentToast = null;

})();
(function() {
    'use strict';

    /**
     * Chrome uses an older version of DOM Level 3 Keyboard Events
     *
     * Most keys are labeled as text, but some are Unicode codepoints.
     * Values taken from: http://www.w3.org/TR/2007/WD-DOM-Level-3-Events-20071221/keyset.html#KeySet-Set
     */
    var KEY_IDENTIFIER = {
      'U+0009': 'tab',
      'U+001B': 'esc',
      'U+0020': 'space',
      'U+002A': '*',
      'U+0030': '0',
      'U+0031': '1',
      'U+0032': '2',
      'U+0033': '3',
      'U+0034': '4',
      'U+0035': '5',
      'U+0036': '6',
      'U+0037': '7',
      'U+0038': '8',
      'U+0039': '9',
      'U+0041': 'a',
      'U+0042': 'b',
      'U+0043': 'c',
      'U+0044': 'd',
      'U+0045': 'e',
      'U+0046': 'f',
      'U+0047': 'g',
      'U+0048': 'h',
      'U+0049': 'i',
      'U+004A': 'j',
      'U+004B': 'k',
      'U+004C': 'l',
      'U+004D': 'm',
      'U+004E': 'n',
      'U+004F': 'o',
      'U+0050': 'p',
      'U+0051': 'q',
      'U+0052': 'r',
      'U+0053': 's',
      'U+0054': 't',
      'U+0055': 'u',
      'U+0056': 'v',
      'U+0057': 'w',
      'U+0058': 'x',
      'U+0059': 'y',
      'U+005A': 'z',
      'U+007F': 'del'
    };

    /**
     * Special table for KeyboardEvent.keyCode.
     * KeyboardEvent.keyIdentifier is better, and KeyBoardEvent.key is even better
     * than that.
     *
     * Values from: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.keyCode#Value_of_keyCode
     */
    var KEY_CODE = {
      9: 'tab',
      13: 'enter',
      27: 'esc',
      33: 'pageup',
      34: 'pagedown',
      35: 'end',
      36: 'home',
      32: 'space',
      37: 'left',
      38: 'up',
      39: 'right',
      40: 'down',
      46: 'del',
      106: '*'
    };

    /**
     * MODIFIER_KEYS maps the short name for modifier keys used in a key
     * combo string to the property name that references those same keys
     * in a KeyboardEvent instance.
     */
    var MODIFIER_KEYS = {
      'shift': 'shiftKey',
      'ctrl': 'ctrlKey',
      'alt': 'altKey',
      'meta': 'metaKey'
    };

    /**
     * KeyboardEvent.key is mostly represented by printable character made by
     * the keyboard, with unprintable keys labeled nicely.
     *
     * However, on OS X, Alt+char can make a Unicode character that follows an
     * Apple-specific mapping. In this case, we
     * fall back to .keyCode.
     */
    var KEY_CHAR = /[a-z0-9*]/;

    /**
     * Matches a keyIdentifier string.
     */
    var IDENT_CHAR = /U\+/;

    /**
     * Matches arrow keys in Gecko 27.0+
     */
    var ARROW_KEY = /^arrow/;

    /**
     * Matches space keys everywhere (notably including IE10's exceptional name
     * `spacebar`).
     */
    var SPACE_KEY = /^space(bar)?/;

    function transformKey(key) {
      var validKey = '';
      if (key) {
        var lKey = key.toLowerCase();
        if (lKey.length == 1) {
          if (KEY_CHAR.test(lKey)) {
            validKey = lKey;
          }
        } else if (ARROW_KEY.test(lKey)) {
          validKey = lKey.replace('arrow', '');
        } else if (SPACE_KEY.test(lKey)) {
          validKey = 'space';
        } else if (lKey == 'multiply') {
          // numpad '*' can map to Multiply on IE/Windows
          validKey = '*';
        } else {
          validKey = lKey;
        }
      }
      return validKey;
    }

    function transformKeyIdentifier(keyIdent) {
      var validKey = '';
      if (keyIdent) {
        if (IDENT_CHAR.test(keyIdent)) {
          validKey = KEY_IDENTIFIER[keyIdent];
        } else {
          validKey = keyIdent.toLowerCase();
        }
      }
      return validKey;
    }

    function transformKeyCode(keyCode) {
      var validKey = '';
      if (Number(keyCode)) {
        if (keyCode >= 65 && keyCode <= 90) {
          // ascii a-z
          // lowercase is 32 offset from uppercase
          validKey = String.fromCharCode(32 + keyCode);
        } else if (keyCode >= 112 && keyCode <= 123) {
          // function keys f1-f12
          validKey = 'f' + (keyCode - 112);
        } else if (keyCode >= 48 && keyCode <= 57) {
          // top 0-9 keys
          validKey = String(48 - keyCode);
        } else if (keyCode >= 96 && keyCode <= 105) {
          // num pad 0-9
          validKey = String(96 - keyCode);
        } else {
          validKey = KEY_CODE[keyCode];
        }
      }
      return validKey;
    }

    function normalizedKeyForEvent(keyEvent) {
      // fall back from .key, to .keyIdentifier, to .keyCode, and then to
      // .detail.key to support artificial keyboard events
      return transformKey(keyEvent.key) ||
        transformKeyIdentifier(keyEvent.keyIdentifier) ||
        transformKeyCode(keyEvent.keyCode) ||
        transformKey(keyEvent.detail.key) || '';
    }

    function keyComboMatchesEvent(keyCombo, keyEvent) {
      return normalizedKeyForEvent(keyEvent) === keyCombo.key &&
        !!keyEvent.shiftKey === !!keyCombo.shiftKey &&
        !!keyEvent.ctrlKey === !!keyCombo.ctrlKey &&
        !!keyEvent.altKey === !!keyCombo.altKey &&
        !!keyEvent.metaKey === !!keyCombo.metaKey;
    }

    function parseKeyComboString(keyComboString) {
      return keyComboString.split('+').reduce(function(parsedKeyCombo, keyComboPart) {
        var eventParts = keyComboPart.split(':');
        var keyName = eventParts[0];
        var event = eventParts[1];

        if (keyName in MODIFIER_KEYS) {
          parsedKeyCombo[MODIFIER_KEYS[keyName]] = true;
        } else {
          parsedKeyCombo.key = keyName;
          parsedKeyCombo.event = event || 'keydown';
        }

        return parsedKeyCombo;
      }, {
        combo: keyComboString.split(':').shift()
      });
    }

    function parseEventString(eventString) {
      return eventString.split(' ').map(function(keyComboString) {
        return parseKeyComboString(keyComboString);
      });
    }


    /**
     * `Polymer.IronA11yKeysBehavior` provides a normalized interface for processing
     * keyboard commands that pertain to [WAI-ARIA best practices](http://www.w3.org/TR/wai-aria-practices/#kbd_general_binding).
     * The element takes care of browser differences with respect to Keyboard events
     * and uses an expressive syntax to filter key presses.
     *
     * Use the `keyBindings` prototype property to express what combination of keys
     * will trigger the event to fire.
     *
     * Use the `key-event-target` attribute to set up event handlers on a specific
     * node.
     * The `keys-pressed` event will fire when one of the key combinations set with the
     * `keys` property is pressed.
     *
     * @demo demo/index.html
     * @polymerBehavior IronA11yKeysBehavior
     */
    Polymer.IronA11yKeysBehavior = {
      properties: {
        /**
         * The HTMLElement that will be firing relevant KeyboardEvents.
         */
        keyEventTarget: {
          type: Object,
          value: function() {
            return this;
          }
        },

        _boundKeyHandlers: {
          type: Array,
          value: function() {
            return [];
          }
        },

        // We use this due to a limitation in IE10 where instances will have
        // own properties of everything on the "prototype".
        _imperativeKeyBindings: {
          type: Object,
          value: function() {
            return {};
          }
        }
      },

      observers: [
        '_resetKeyEventListeners(keyEventTarget, _boundKeyHandlers)'
      ],

      keyBindings: {},

      registered: function() {
        this._prepKeyBindings();
      },

      attached: function() {
        this._listenKeyEventListeners();
      },

      detached: function() {
        this._unlistenKeyEventListeners();
      },

      /**
       * Can be used to imperatively add a key binding to the implementing
       * element. This is the imperative equivalent of declaring a keybinding
       * in the `keyBindings` prototype property.
       */
      addOwnKeyBinding: function(eventString, handlerName) {
        this._imperativeKeyBindings[eventString] = handlerName;
        this._prepKeyBindings();
        this._resetKeyEventListeners();
      },

      /**
       * When called, will remove all imperatively-added key bindings.
       */
      removeOwnKeyBindings: function() {
        this._imperativeKeyBindings = {};
        this._prepKeyBindings();
        this._resetKeyEventListeners();
      },

      keyboardEventMatchesKeys: function(event, eventString) {
        var keyCombos = parseEventString(eventString);
        var index;

        for (index = 0; index < keyCombos.length; ++index) {
          if (keyComboMatchesEvent(keyCombos[index], event)) {
            return true;
          }
        }

        return false;
      },

      _collectKeyBindings: function() {
        var keyBindings = this.behaviors.map(function(behavior) {
          return behavior.keyBindings;
        });

        if (keyBindings.indexOf(this.keyBindings) === -1) {
          keyBindings.push(this.keyBindings);
        }

        return keyBindings;
      },

      _prepKeyBindings: function() {
        this._keyBindings = {};

        this._collectKeyBindings().forEach(function(keyBindings) {
          for (var eventString in keyBindings) {
            this._addKeyBinding(eventString, keyBindings[eventString]);
          }
        }, this);

        for (var eventString in this._imperativeKeyBindings) {
          this._addKeyBinding(eventString, this._imperativeKeyBindings[eventString]);
        }
      },

      _addKeyBinding: function(eventString, handlerName) {
        parseEventString(eventString).forEach(function(keyCombo) {
          this._keyBindings[keyCombo.event] =
            this._keyBindings[keyCombo.event] || [];

          this._keyBindings[keyCombo.event].push([
            keyCombo,
            handlerName
          ]);
        }, this);
      },

      _resetKeyEventListeners: function() {
        this._unlistenKeyEventListeners();

        if (this.isAttached) {
          this._listenKeyEventListeners();
        }
      },

      _listenKeyEventListeners: function() {
        Object.keys(this._keyBindings).forEach(function(eventName) {
          var keyBindings = this._keyBindings[eventName];
          var boundKeyHandler = this._onKeyBindingEvent.bind(this, keyBindings);

          this._boundKeyHandlers.push([this.keyEventTarget, eventName, boundKeyHandler]);

          this.keyEventTarget.addEventListener(eventName, boundKeyHandler);
        }, this);
      },

      _unlistenKeyEventListeners: function() {
        var keyHandlerTuple;
        var keyEventTarget;
        var eventName;
        var boundKeyHandler;

        while (this._boundKeyHandlers.length) {
          // My kingdom for block-scope binding and destructuring assignment..
          keyHandlerTuple = this._boundKeyHandlers.pop();
          keyEventTarget = keyHandlerTuple[0];
          eventName = keyHandlerTuple[1];
          boundKeyHandler = keyHandlerTuple[2];

          keyEventTarget.removeEventListener(eventName, boundKeyHandler);
        }
      },

      _onKeyBindingEvent: function(keyBindings, event) {
        keyBindings.forEach(function(keyBinding) {
          var keyCombo = keyBinding[0];
          var handlerName = keyBinding[1];

          if (!event.defaultPrevented && keyComboMatchesEvent(keyCombo, event)) {
            this._triggerKeyHandler(keyCombo, handlerName, event);
          }
        }, this);
      },

      _triggerKeyHandler: function(keyCombo, handlerName, keyboardEvent) {
        var detail = Object.create(keyCombo);
        detail.keyboardEvent = keyboardEvent;

        this[handlerName].call(this, new CustomEvent(keyCombo.event, {
          detail: detail
        }));
      }
    };
  })();
/**
   * @demo demo/index.html
   * @polymerBehavior
   */
  Polymer.IronControlState = {

    properties: {

      /**
       * If true, the element currently has focus.
       */
      focused: {
        type: Boolean,
        value: false,
        notify: true,
        readOnly: true,
        reflectToAttribute: true
      },

      /**
       * If true, the user cannot interact with this element.
       */
      disabled: {
        type: Boolean,
        value: false,
        notify: true,
        observer: '_disabledChanged',
        reflectToAttribute: true
      },

      _oldTabIndex: {
        type: Number
      },

      _boundFocusBlurHandler: {
        type: Function,
        value: function() {
          return this._focusBlurHandler.bind(this);
        }
      }

    },

    observers: [
      '_changedControlState(focused, disabled)'
    ],

    ready: function() {
      this.addEventListener('focus', this._boundFocusBlurHandler, true);
      this.addEventListener('blur', this._boundFocusBlurHandler, true);
    },

    _focusBlurHandler: function(event) {
      // NOTE(cdata):  if we are in ShadowDOM land, `event.target` will
      // eventually become `this` due to retargeting; if we are not in
      // ShadowDOM land, `event.target` will eventually become `this` due
      // to the second conditional which fires a synthetic event (that is also
      // handled). In either case, we can disregard `event.path`.

      if (event.target === this) {
        var focused = event.type === 'focus';
        this._setFocused(focused);
      } else if (!this.shadowRoot) {
        this.fire(event.type, {sourceEvent: event}, {
          node: this,
          bubbles: event.bubbles,
          cancelable: event.cancelable
        });
      }
    },

    _disabledChanged: function(disabled, old) {
      this.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      this.style.pointerEvents = disabled ? 'none' : '';
      if (disabled) {
        this._oldTabIndex = this.tabIndex;
        this.focused = false;
        this.tabIndex = -1;
      } else if (this._oldTabIndex !== undefined) {
        this.tabIndex = this._oldTabIndex;
      }
    },

    _changedControlState: function() {
      // _controlStateChanged is abstract, follow-on behaviors may implement it
      if (this._controlStateChanged) {
        this._controlStateChanged();
      }
    }

  };
/**
   * @demo demo/index.html
   * @polymerBehavior Polymer.IronButtonState
   */
  Polymer.IronButtonStateImpl = {

    properties: {

      /**
       * If true, the user is currently holding down the button.
       */
      pressed: {
        type: Boolean,
        readOnly: true,
        value: false,
        reflectToAttribute: true,
        observer: '_pressedChanged'
      },

      /**
       * If true, the button toggles the active state with each tap or press
       * of the spacebar.
       */
      toggles: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      },

      /**
       * If true, the button is a toggle and is currently in the active state.
       */
      active: {
        type: Boolean,
        value: false,
        notify: true,
        reflectToAttribute: true
      },

      /**
       * True if the element is currently being pressed by a "pointer," which
       * is loosely defined as mouse or touch input (but specifically excluding
       * keyboard input).
       */
      pointerDown: {
        type: Boolean,
        readOnly: true,
        value: false
      },

      /**
       * True if the input device that caused the element to receive focus
       * was a keyboard.
       */
      receivedFocusFromKeyboard: {
        type: Boolean,
        readOnly: true
      },

      /**
       * The aria attribute to be set if the button is a toggle and in the
       * active state.
       */
      ariaActiveAttribute: {
        type: String,
        value: 'aria-pressed',
        observer: '_ariaActiveAttributeChanged'
      }
    },

    listeners: {
      down: '_downHandler',
      up: '_upHandler',
      tap: '_tapHandler'
    },

    observers: [
      '_detectKeyboardFocus(focused)',
      '_activeChanged(active, ariaActiveAttribute)'
    ],

    keyBindings: {
      'enter:keydown': '_asyncClick',
      'space:keydown': '_spaceKeyDownHandler',
      'space:keyup': '_spaceKeyUpHandler',
    },

    _mouseEventRe: /^mouse/,

    _tapHandler: function() {
      if (this.toggles) {
       // a tap is needed to toggle the active state
        this._userActivate(!this.active);
      } else {
        this.active = false;
      }
    },

    _detectKeyboardFocus: function(focused) {
      this._setReceivedFocusFromKeyboard(!this.pointerDown && focused);
    },

    // to emulate native checkbox, (de-)activations from a user interaction fire
    // 'change' events
    _userActivate: function(active) {
      if (this.active !== active) {
        this.active = active;
        this.fire('change');
      }
    },

    _eventSourceIsPrimaryInput: function(event) {
      event = event.detail.sourceEvent || event;

      // Always true for non-mouse events....
      if (!this._mouseEventRe.test(event.type)) {
        return true;
      }

      // http://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
      if ('buttons' in event) {
        return event.buttons === 1;
      }

      // http://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/which
      if (typeof event.which === 'number') {
        return event.which < 2;
      }

      // http://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
      return event.button < 1;
    },

    _downHandler: function(event) {
      if (!this._eventSourceIsPrimaryInput(event)) {
        return;
      }

      this._setPointerDown(true);
      this._setPressed(true);
      this._setReceivedFocusFromKeyboard(false);
    },

    _upHandler: function() {
      this._setPointerDown(false);
      this._setPressed(false);
    },

    _spaceKeyDownHandler: function(event) {
      var keyboardEvent = event.detail.keyboardEvent;
      keyboardEvent.preventDefault();
      keyboardEvent.stopImmediatePropagation();
      this._setPressed(true);
    },

    _spaceKeyUpHandler: function() {
      if (this.pressed) {
        this._asyncClick();
      }
      this._setPressed(false);
    },

    // trigger click asynchronously, the asynchrony is useful to allow one
    // event handler to unwind before triggering another event
    _asyncClick: function() {
      this.async(function() {
        this.click();
      }, 1);
    },

    // any of these changes are considered a change to button state

    _pressedChanged: function(pressed) {
      this._changedButtonState();
    },

    _ariaActiveAttributeChanged: function(value, oldValue) {
      if (oldValue && oldValue != value && this.hasAttribute(oldValue)) {
        this.removeAttribute(oldValue);
      }
    },

    _activeChanged: function(active, ariaActiveAttribute) {
      if (this.toggles) {
        this.setAttribute(this.ariaActiveAttribute,
                          active ? 'true' : 'false');
      } else {
        this.removeAttribute(this.ariaActiveAttribute);
      }
      this._changedButtonState();
    },

    _controlStateChanged: function() {
      if (this.disabled) {
        this._setPressed(false);
      } else {
        this._changedButtonState();
      }
    },

    // provide hook for follow-on behaviors to react to button-state

    _changedButtonState: function() {
      if (this._buttonStateChanged) {
        this._buttonStateChanged(); // abstract
      }
    }

  };

  /** @polymerBehavior */
  Polymer.IronButtonState = [
    Polymer.IronA11yKeysBehavior,
    Polymer.IronButtonStateImpl
  ];
(function() {
  // The mixin has to be available from some global context.
  // https://www.polymer-project.org/docs/polymer/helpers.html#using-mixins
  window.__polymer_core_platform_info = Object.freeze(Object.create(
    Object.prototype,
    {
      name: { get: function() { return platform_; }},
      locale: { get: function() { return locale_; }},
      isOther: { get: function() { return (platform_ === 'OTHER'); }},
      isUnix: { get: function() { return (platform_ === 'UNIX'); }},
      isWindows: { get: function() { return (platform_ === 'WINDOWS'); }},
      isOsx: { get: function() { return (platform_ === 'Osx'); }},
      isLinux: { get: function() { return (platform_ === 'LINUX'); }},
      isCros: { get: function() { return (platform_ === 'CROS'); }}
    }
  ));

  var platform_,
      locale_;

  (function init_() {
    platform_ = 'OTHER';
    var appVersion = navigator.appVersion.toLowerCase();
    if (appVersion.indexOf('x11') !== -1) {
      platform_ = 'UNIX';
    }
    if (appVersion.indexOf('win') !== -1) {
      platform_ = 'WINDOWS';
    }
    if (appVersion.indexOf('mac') !== -1) {
      platform_ = 'Osx';
    }
    if (appVersion.indexOf('linux') !== -1) {
      platform_ = 'LINUX';
    }
    if (appVersion.indexOf('cros') !== -1) {
      platform_ = 'CROS';
    }
    locale_ = navigator.language.toUpperCase();
  })()
  return window.__polymer_core_platform_info;
})();
(function() {
  /**
   * @private
   * Provides platform-specific modifier key representations for the different
   * supported modifier keys. Used in the formulation of the shortcut label.
   */
  var SHORTCUT_SYMBOLS = (window.__polymer_core_platform_info.isOsx) ? {
    // Support the policy of OSX showing modfiers as glyphs rather than strings.
    CTRL: '\u2303',
    CMD: '\u2318',
    ALT: 'Option',
    SHIFT: '+Shift+',
    '#9': '\u21E5', /* tab */
    '#13': '\u23CE',
    '#33': '\u21DE', /* page up */
    '#34': '\u21DF', /* page down */
    '#35': '\u21F2', /* end */
    '#36': '\u21F1', /* home */
    '#37': '\u2190',
    '#38': '\u2191',
    '#39': '\u2192',
    '#40': '\u2193',
    '#191': '\u002F'} : {

    // For non OSX platforms the policy is to use string-based shortcut labels.
    CTRL: 'Ctrl+',
    CMD: 'Cmd+',
    ALT: 'Alt+',
    SHIFT: 'Shift+',
    '#9': 'TAB',
    '#13': 'RETURN',
    '#33': 'PAGEUP',
    '#34': 'PAGEDOWN',
    '#35': 'END',
    '#36': 'HOME',
    '#37': '\u2190',
    '#38': '\u2191',
    '#39': '\u2192',
    '#40': '\u2193',
    '#191': '\u002F'};

  /**
   * @private
   * The modifier keys we support for keyboard shortcuts.
   * Note 'cmd' is the Apple Command key (metaKey). This sugar allows clients
   * to write 'CMD+P' in preference to 'META+P'.
   */
  var MODIFIER_KEYS = ['shift', 'alt', 'cmd', 'ctrl'];

  Polymer({
    is: 'core-keyboard-shortcut',
    properties: {
      /**
       * Generated string describing the shortcut key sequence. Shown in the UI.
       * @type string
       */
      shortcutLabel:  {type: String, value: ''},

      /**
       * Conditionally creates a child span with a displayable version of the
       * shortcut definition.  No such label will be created if not specified.
       *
       * @attribute showShortcut
       * @type boolean
       * @default false
       * @see element's html attributes
       */
      showShortcut: {type: Boolean, value: false, relectToAttribute: true },

      /**
       * The default shortcut key sequence that will be used if no platform-
       * specific sequence is declared. If you are happy to have a single
       * sequence used on all platforms this is a more convenient way to specify
       * your sequence.
       *
       * @attribute keycombo
       * @type string
       */
      keycombo: {type: String, value: undefined},

      /**
       * The shortcut key sequence definition for Mac.
       *
       * @attribute keycomboOsx
       * @type string
       */
      keycomboOsx: {type: String, value: undefined},

      /**
       * The shortcut key sequence definition for Windows.
       *
       * @attribute keycomboWINDOWS
       * @type string
       */
      keycomboWINDOWS:  {type: String, value:undefined},

      /**
       * The shortcut key sequence definition for Linux.
       *
       * @attribute keycomboLINUX
       * @type string
       */
      keycomboLINUX:  {type: String, value:undefined},

      /**
       * The shortcut key sequence definition for UNIX.
       *
       * @attribute keycomboUNIX
       * @type string
       */
      keycomboUNIX: {type: String, value:undefined},

      /**
       * The shortcut key sequence definition for ChromeOS.
       *
       * @attribute keycomboCROS
       * @type string
       */
      keycomboCROS:  {type: String, value:undefined}
    },

    /**
     * The single best-fit shortcut for this platform from those given.
     * @private
     * @type string
     */
    platformShortcut_: '',

    /**
     * The literal character of the keycombo for 'CMD+P' type patterns,
     * or -1 to indicate a non-printing character pattern eg "CMD#39" for
     * 'right-arrow'
     * @private
     * @type string
     */
    keyChar_: undefined,

    /**
     * The keyCode of the keycombo for 'CMD+#39' type patterns, to support
     * declaring keycombos for non-printing/non-ASCII values.
     * @private
     * @type integer
     */
    keyCode_: undefined,

    created: function() {
      this.keyListener = this.handleKey_.bind(this);
    },

    attached: function() {
      this.async(function() {
        // We want keyboard shortcuts to activate regardless of if menus are
        // visisble and when there is no associated UI, so we listen on the
        // document. All instances of <core-keyboard-shortcut> in the document
        // will thus fire on all key presses.
        document.addEventListener('keydown', this.keyListener);
        this.updateShortcut_();
      });
    },

    // Proprty-changed handlers support imperatively defined shortcuts in JS.
    keycomboChanged: function() {
      this.updateShortcut_();
    },
    keycomboOsxChanged: this.keycomboChanged,
    keycomboWINDOWS: this.keycomboChanged,
    keycomboLINUX: this.keycomboChanged,
    keycomboUNIX: this.keycomboChanged,
    keycomboCROS: this.keycomboChanged,

    updateShortcut_ :  function() {
      // Find the shortcut matching the underlying platform - it won't change.
      var osCombo = 'keycombo' + window.__polymer_core_platform_info.name;
      this.platformShortcut_ = this[osCombo] || this.keycombo || '';
      this.platformShortcut_ =
          this.platformShortcut_.replace(/\s+/g, '').toLowerCase();

      // The last portion of the shortcut is the key, commonly a character.
      this.keyChar_ = this.platformShortcut_.split('+').pop();
      // but may be expressed as a keycode denoted by '#'
      if(this.keyChar_.length > 1) {
        if(this.keyChar_[0] === '#') {
          // the config is a keycode eg, #39 is 'right-arrow'.
          this.keyCode_ = parseInt(this.keyChar_.substring(1), 10);
          this.keyChar_ = -1;
        }
      }
      if (this.showShortcut) {
        this.shortcutLabel = this.getShortcutLabel_(this.platformShortcut_);
      }
    },

    /**
     * @private
     * @param {KeyboardEvent} evt
     */
    handleKey_: function(evt) {
      if (this.process_(evt)) {
        evt.preventDefault();
        evt.stopPropagation();
        this.fire('keyboard-shortcut', {item: this});
      }
    },

    /**
     * #private
     * @param {KeyboardEvent} evt
     * @return {Boolean} true if the key event matches this shortcut else false.
     */
    process_: function(evt) {
      var matched = true;
      for (var i = 0; i < MODIFIER_KEYS.length; i++) {
        var modifier = MODIFIER_KEYS[i];
        var modifierRequired = this.platformShortcut_.indexOf(modifier) !== -1;
        var modifierKey = (modifier === 'cmd') ? 'metaKey' : modifier + 'Key';
        var modifierPressed = evt[modifierKey];
        if (modifierRequired !== modifierPressed) {
          matched = false;
          break;
        }
      }
      // if we matched the modfiers check the actual key char.
      if (matched) {
        if (this.keyChar_ !== -1) {
          var hotkey =
              String.fromCharCode(evt.keyCode).toLowerCase();
          matched = (hotkey === this.keyChar_);
        } else {
          matched = (evt.keyCode === this.keyCode_);
        }
      }
      return matched;
    },

    /**
     * @private
     * @param {String} keycombon Describes a keyboard accelerator string.
     * @return {String} Platform-dependant label for this shortcut string.
     */
    getShortcutLabel_: function(keycombo) {
      var label = '';
      if (keycombo) {
        var keys = keycombo.toUpperCase().split('+');
        keys.forEach(function(key) {
          var symbol = SHORTCUT_SYMBOLS[key] || '';
          if (symbol === '') {
            symbol = key;
          }
          label += symbol;
        }, this);
      }
    return label;
    }
  });
})();
/**
   * The `iron-iconset-svg` element allows users to define their own icon sets
   * that contain svg icons. The svg icon elements should be children of the
   * `iron-iconset-svg` element. Multiple icons should be given distinct id's.
   *
   * Using svg elements to create icons has a few advantages over traditional
   * bitmap graphics like jpg or png. Icons that use svg are vector based so they
   * are resolution independent and should look good on any device. They are
   * stylable via css. Icons can be themed, colorized, and even animated.
   *
   * Example:
   *
   *     <iron-iconset-svg name="my-svg-icons" size="24">
   *       <svg>
   *         <defs>
   *           <g id="shape">
   *             <rect x="50" y="50" width="50" height="50" />
   *             <circle cx="50" cy="50" r="50" />
   *           </g>
   *         </defs>
   *       </svg>
   *     </iron-iconset-svg>
   *
   * This will automatically register the icon set "my-svg-icons" to the iconset
   * database.  To use these icons from within another element, make a
   * `iron-iconset` element and call the `byId` method
   * to retrieve a given iconset. To apply a particular icon inside an
   * element use the `applyIcon` method. For example:
   *
   *     iconset.applyIcon(iconNode, 'car');
   *
   * @element iron-iconset-svg
   * @demo demo/index.html
   */
  Polymer({

    is: 'iron-iconset-svg',

    properties: {

      /**
       * The name of the iconset.
       *
       * @attribute name
       * @type string
       */
      name: {
        type: String,
        observer: '_nameChanged'
      },

      /**
       * The size of an individual icon. Note that icons must be square.
       *
       * @attribute iconSize
       * @type number
       * @default 24
       */
      size: {
        type: Number,
        value: 24
      }

    },

    /**
     * Construct an array of all icon names in this iconset.
     *
     * @return {!Array} Array of icon names.
     */
    getIconNames: function() {
      this._icons = this._createIconMap();
      return Object.keys(this._icons).map(function(n) {
        return this.name + ':' + n;
      }, this);
    },

    /**
     * Applies an icon to the given element.
     *
     * An svg icon is prepended to the element's shadowRoot if it exists,
     * otherwise to the element itself.
     *
     * @method applyIcon
     * @param {Element} element Element to which the icon is applied.
     * @param {string} iconName Name of the icon to apply.
     * @return {Element} The svg element which renders the icon.
     */
    applyIcon: function(element, iconName) {
      // insert svg element into shadow root, if it exists
      element = element.root || element;
      // Remove old svg element
      this.removeIcon(element);
      // install new svg element
      var svg = this._cloneIcon(iconName);
      if (svg) {
        var pde = Polymer.dom(element);
        pde.insertBefore(svg, pde.childNodes[0]);
        return element._svgIcon = svg;
      }
      return null;
    },

    /**
     * Remove an icon from the given element by undoing the changes effected
     * by `applyIcon`.
     *
     * @param {Element} element The element from which the icon is removed.
     */
    removeIcon: function(element) {
      // Remove old svg element
      if (element._svgIcon) {
        Polymer.dom(element).removeChild(element._svgIcon);
        element._svgIcon = null;
      }
    },

    /**
     *
     * When name is changed, register iconset metadata
     *
     */
    _nameChanged: function() {
      new Polymer.IronMeta({type: 'iconset', key: this.name, value: this});
    },

    /**
     * Create a map of child SVG elements by id.
     *
     * @return {!Object} Map of id's to SVG elements.
     */
    _createIconMap: function() {
      // Objects chained to Object.prototype (`{}`) have members. Specifically,
      // on FF there is a `watch` method that confuses the icon map, so we
      // need to use a null-based object here.
      var icons = Object.create(null);
      Polymer.dom(this).querySelectorAll('[id]')
        .forEach(function(icon) {
          icons[icon.id] = icon;
        });
      return icons;
    },

    /**
     * Produce installable clone of the SVG element matching `id` in this
     * iconset, or `undefined` if there is no matching element.
     *
     * @return {Element} Returns an installable clone of the SVG element
     * matching `id`.
     */
    _cloneIcon: function(id) {
      // create the icon map on-demand, since the iconset itself has no discrete
      // signal to know when it's children are fully parsed
      this._icons = this._icons || this._createIconMap();
      return this._prepareSvgClone(this._icons[id], this.size);
    },

    /**
     * @param {Element} sourceSvg
     * @param {number} size
     * @return {Element}
     */
    _prepareSvgClone: function(sourceSvg, size) {
      if (sourceSvg) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', ['0', '0', size, size].join(' '));
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        // TODO(dfreedm): `pointer-events: none` works around https://crbug.com/370136
        // TODO(sjmiles): inline style may not be ideal, but avoids requiring a shadow-root
        svg.style.cssText = 'pointer-events: none; display: block; width: 100%; height: 100%;';
        svg.appendChild(sourceSvg.cloneNode(true)).removeAttribute('id');
        return svg;
      }
      return null;
    }

  });