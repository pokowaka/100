'use strict';

// XORCipher - Super simple encryption using XOR and Base64
//
// Depends on [Underscore](http://underscorejs.org/).
//
// As a warning, this is **not** a secure encryption algorythm. It uses a very
// simplistic keystore and will be easy to crack.
//
// The Base64 algorythm is a modification of the one used in phpjs.org
// * http://phpjs.org/functions/base64_encode/
// * http://phpjs.org/functions/base64_decode/
//
// Examples
// --------
//
//     XORCipher.encode("test", "foobar");   // => "EgocFhUX"
//     XORCipher.decode("test", "EgocFhUX"); // => "foobar"
//
/* jshint forin:true, noarg:true, noempty:true, eqeqeq:true, strict:true,
   undef:true, unused:true, curly:true, browser:true, indent:2, maxerr:50 */
/* global _ */
(function(exports) {
  "use strict";
 
  var XORCipher = {
    encode: function(key, data) {
      data = xor_encrypt(key, data);
      return b64_encode(data);
    },
    decode: function(key, data) {
      data = b64_decode(data);
      return xor_decrypt(key, data);
    }
  };
 
  var b64_table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
 
  function b64_encode(data) {
    var o1, o2, o3, h1, h2, h3, h4, bits, r, i = 0, enc = "";
    if (!data) { return data; }
    do {
      o1 = data[i++];
      o2 = data[i++];
      o3 = data[i++];
      bits = o1 << 16 | o2 << 8 | o3;
      h1 = bits >> 18 & 0x3f;
      h2 = bits >> 12 & 0x3f;
      h3 = bits >> 6 & 0x3f;
      h4 = bits & 0x3f;
      enc += b64_table.charAt(h1) + b64_table.charAt(h2) + b64_table.charAt(h3) + b64_table.charAt(h4);
    } while (i < data.length);
    r = data.length % 3;
    return (r ? enc.slice(0, r - 3) : enc) + "===".slice(r || 3);
  }
 
  function b64_decode(data) {
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, result = [];
    if (!data) { return data; }
    data += "";
    do {
      h1 = b64_table.indexOf(data.charAt(i++));
      h2 = b64_table.indexOf(data.charAt(i++));
      h3 = b64_table.indexOf(data.charAt(i++));
      h4 = b64_table.indexOf(data.charAt(i++));
      bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
      o1 = bits >> 16 & 0xff;
      o2 = bits >> 8 & 0xff;
      o3 = bits & 0xff;
      result.push(o1);
      if (h3 !== 64) {
        result.push(o2);
        if (h4 !== 64) {
          result.push(o3);
        }
      }
    } while (i < data.length);
    return result;
  }
 
  function keyCharAt(key, i) {
    return key.charCodeAt( Math.floor(i % key.length) );
  }
 
  function xor_encrypt(key, data) {
    return _.map(data, function(c, i) {
      return c.charCodeAt(0) ^ keyCharAt(key, i);
    });
  }
 
  function xor_decrypt(key, data) {
    return _.map(data, function(c, i) {
      return String.fromCharCode( c ^ keyCharAt(key, i) );
    }).join("");
  }
 
  exports.XORCipher = XORCipher;
 
})(this);




function QueryStringToJSON() {
  var pairs = location.search.slice(1).split('&');

  var result = {};
  pairs.forEach(function(pair) {
    pair = pair.split('=');
    result[pair[0]] = decodeURIComponent(pair[1] || '');
  });

  return JSON.parse(JSON.stringify(result));
}

var secretKey = "supersafesecret";
var query_string = QueryStringToJSON();

/* Controllers */
var wordApp = angular.module('wordApp', []);

var guessApp = angular.module('guessApp', []);

guessApp.controller("guessCtrl", function($scope) {
  // These come from the query url
  var description =  XORCipher.decode(secretKey, query_string['description']);
  var concept = XORCipher.decode(secretKey, query_string['concept']);
  $scope.description = description.split(',');
  $scope.concept = concept;
  $scope.revealed = "";
  $scope.reveal = 
    function() {
    $scope.revealed = $scope.concept; }
});

wordApp.controller("wordCtrl",  function($scope, $http) {
  // These come from the query url
  var wordUrl = query_string['words'];
  var conceptUrl = query_string['concepts'];

  $scope.words = [];
  $scope.description = [];

  if (wordUrl == null) {
    wordUrl="data/sample.json";
  };
  if (conceptUrl == null) {
    conceptUrl="data/concepts.json"
  };
 
  // Get the word list
  $http.get(wordUrl).success(function(data) {
    $scope.words=data;
  });

  // Get the concepts and pick a random one.
  $http.get(conceptUrl).success(function(data) {
    $scope.concepts=data;
    $scope.concept=$scope.concepts[Math.floor(Math.random()*$scope.concepts.length)];
  });


  $scope.addWord = function(word) { 
    $scope.description.push(word);
  } 
  $scope.removeLastWord = function () {
    $scope.description.pop();
  }
  $scope.share = function() {
    var encodedConcept =  XORCipher.encode(secretKey, $scope.concept);
    var encodedDesc = XORCipher.encode(secretKey, $scope.description.join());
    var url = "http://localhost:8000/app/answer.html?concept=" + encodedConcept + "%26description=" + encodedDesc;
    window.location = "mailto:somebody@example.com?subject=come play 10 and 100 with me&body=" + url;
  }
});


