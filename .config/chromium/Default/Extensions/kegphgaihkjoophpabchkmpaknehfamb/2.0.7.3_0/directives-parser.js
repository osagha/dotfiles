/*
 * Parses directive (if any) from a selector
 * See https://github.com/couponfollow/catc2/issues/292#issuecomment-204865151 to see directive formatting rules
 */

var directivesParser = new (function() {
  var stateMachine = {
    "initial": { "!": "firstExclamationEncountered", "anythingElse": "directivesEnd" },
    "firstExclamationEncountered": { "!": "directiveToStart", "anythingElse": "directivesEnd" },
    "directiveToStart": { "!": "firstEndingExclamation", "(": "errorUnexpectedSymbol", ")": "errorUnexpectedSymbol", "anythingElse": "directiveName", "end": "unexpectedEnd" },
    "directiveName": { "!": "firstEndingExclamation", "(": "directiveParamToStart", ")": "errorUnexpectedSymbol", ":": "directiveToStart", "anythingElse": "directiveName", "end": "unexpectedEnd" },
    "firstEndingExclamation": { "!": "directivesEnd", "anythingElse": "exclamationNotAllowed", "end": "unexpectedEnd" },
    "directiveParamToStart": { ",": "errorUnexpectedSymbol", ")": "paramsEnded", "anythingElse": "paramValue", "end": "unexpectedEnd" },
    "paramValue": { ",": "directiveParamToStart", ")": "paramsEnded", "anythingElse": "paramValue", "end": "unexpectedEnd" },
    "paramsEnded": { ":": "directiveToStart", "!": "firstEndingExclamation", "anythingElse": "errorUnexpectedSymbol", "end": "unexpectedEnd" }

  };

  var me = this;

  this.parse = function(field) {
    var currentStateName = "initial",
      currentState,
      nextStateName,
      fieldValue = "",
      directives = {},
      params = [],
      fieldLength,
      currIndex = 0,
      directiveNameStarted = false,
      paramStarted = false,
      directiveName = "",
      paramValue = "";

    // directive can only be present in string fields
    if (field === null || typeof field !== "string") {
      return { directives: {}, value: field };
    }

    fieldLength = field.length;

    while (currIndex < fieldLength) {
      var currChar = field.charAt(currIndex);

      currentState = stateMachine[currentStateName];

      if (currChar in currentState) {
        nextStateName = currentState[currChar];
      }
      else {
        nextStateName = currentState["anythingElse"];
      }


      if (directiveNameStarted && nextStateName != "directiveName") {
        directiveNameStarted = false;
      }

      if (paramStarted && nextStateName != "paramValue") {
        paramStarted = false;
      }

      if (directiveNameStarted) {
        directiveName += currChar;
      }

      if (paramStarted) {
        paramValue += currChar;
      }


      if (nextStateName == "directiveToStart") {
        directiveNameStarted = true;
      }

      if (nextStateName == "directiveParamToStart") {
        paramStarted = true;
      }


      if ((nextStateName == "directiveParamToStart" || nextStateName == "paramsEnded") && paramValue.length > 0) {
        // push previous param to params array
        params.push(paramValue);
        paramValue = "";
      }

      if ((nextStateName == "directiveToStart" || nextStateName == "directivesEnd") && directiveName.length > 0) {
        // push previous directive to directives array
        directives[directiveName] = params;
        params = [];
        directiveName = "";
      }

      if (nextStateName == "errorUnexpectedSymbol") {
        throw Error("Unexpected symbol " + currChar + " at index " + currIndex);
      }
      else if (nextStateName == "exclamationNotAllowed") {
        throw Error("! symbol not allowed in directive name");
      }
      else if (nextStateName == "directivesEnd") {
        // set currIndex to the location where field value starts
        if (currentStateName == "firstExclamationEncountered") {
          currIndex--;
        }
        else if (currentStateName != "initial") {
          currIndex++;
        }
        break;
      }

      currentStateName = nextStateName;

      currIndex++;
    }

    if (currIndex < fieldLength) {
      fieldValue = field.substring(currIndex);
    }

    return { directives: directives, value: fieldValue };
  };

  this.parseInt = function(field) {
    var parsedVal = me.parse(field);

    if (parsedVal.value != null) {
      parsedVal.value = parseInt(parsedVal.value);
    }

    return parsedVal;
  };

  this.parseBool = function(field) {
    var parsedVal = me.parse(field);

    if (parsedVal.value != null) {
      parsedVal.value = parsedVal.value == "true" || parsedVal.value == "1";
    }

    return parsedVal;
  };

})();
