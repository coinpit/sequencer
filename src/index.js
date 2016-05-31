var bluebird = require('bluebird')
var util     = require('util')
var assert   = require('affirm.js')

module.exports = function (counter) {
  var workQueue      = []
  var executor       = {}
  var workInProgress = false

  function execute() {
    var work = workQueue.shift()
    if (work) {
      try {
        var p = work.work()
        if (p && typeof p.then === 'function') {
          return p.then(work.promise.resolve.bind(work.promise))
            .catch(work.promise.reject.bind(work.promise))
            .finally(executionDone)
        } else {
          work.promise.resolve(p)
          executionDone()
        }
      } catch (e) {
        handleError(e)
        
        work.promise.reject(e)
        executionDone()
      }
    } else {
      workInProgress = false
    }
  }

  function executionDone() {
    //decrement counter
    if (counter) counter.decrement();
    execute();
  }

  function handleError(e) {
    util.log('sequential executor', e, e.stack)
  }

  executor.push = function (work) {
    return insertIntoWorkQueue(work, Array.prototype.push)
  }

  executor.unshift = function (work) {
    return insertIntoWorkQueue(work, Array.prototype.unshift)
  }

  function insertIntoWorkQueue(work, action) {
    assert(work && typeof work == 'function', "not a valid function")
    var promise = bluebird.defer()
    action.call(workQueue, { work: work, promise: promise })
    if (counter) counter.increment();
    if (!workInProgress) {
      workInProgress = true
      process.nextTick(execute)
    }
    return promise.promise
  }

  executor.size = function(){
    return workQueue.length
  }
  return executor;
}