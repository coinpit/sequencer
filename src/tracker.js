var assert = require("affirm.js")

module.exports = (function() {
  var counter = {} ;
  var count = 0;
  counter.increment = function(){
    assert(count >= 0, "count " + count + " can not be negative")
    count++;
  }

  counter.decrement = function(){
    assert(count > 0, "count " + count + " can not be negative")
    count--;
  }

  counter.count = function(){
    return count;
  }

  return counter
})();