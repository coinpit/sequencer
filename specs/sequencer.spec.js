require('mocha-generators').install()
var SequentialExecutor = require('../src/index')
var bluebird           = require('bluebird')
var expect             = require("expect.js")
var sinon              = require('sinon')
var sequenceTracker    = require('../src/tracker')

describe('sequential executor testing', function () {
  var result
  var counter
  var promise            = new IAM('i am promise')
  var generator          = new IAM('i am generator')
  var simple             = new IAM('i am simple')
  var sequentialExecutor = SequentialExecutor(sequenceTracker)

  var promiseExecutor = bluebird.coroutine(generatorExecutor)

  beforeEach(function () {
    result  = []
    counter = 0
  })

  afterEach(function () {

  })

  it('check counter incrment decrement', function (done) {
    sinon.spy(sequenceTracker, "increment");
    sinon.spy(sequenceTracker, "decrement");

    var expected = []
    var promises = []
    for (var i = 0; i < 10; i++) {
      promises.push(push(promiseExecutor, promise, i, expected));
    }

    bluebird.all(promises).then(function (results) {
      expect(sequenceTracker.increment.callCount).to.be.eql(10);
      expect(sequenceTracker.decrement.callCount).to.be.eql(9);
      done()
    })

  })

  it('happy path promise', function (done) {
    var expected = []
    var promises = []
    for (var i = 0; i < 10; i++) {
      promises.push(push(promiseExecutor, promise, i, expected))
    }
    bluebird.all(promises).then(function (results) {
      expect(result).to.be.eql(expected)
      done()
    })
  })

  it('promise-promise-generator-promise-simple-promise-string-simpleError-promiseError-promise should run atleast 6 promise in sequence', function (done) {
    var expected = []
    var results  = []
    var promises = []
    var i        = 1
    promises.push(push(promiseExecutor, promise, 1, expected))
    promises.push(push(promiseExecutor, promise, 2, expected))
    promises.push(sequentialExecutor.push(generatorExecutor.bind(generator, i + ' arg1', i + ' arg2', i + ' arg3', i + 1)))
    promises.push(push(promiseExecutor, promise, 3, expected))
    promises.push(push(simpleExecutor, simple, 4, expected))
    promises.push(push(promiseExecutor, promise, 5, expected))
    promises.push(sequentialExecutor.push(function () {
      throw new Error("i throw error :)")
    }))
    promises.push(sequentialExecutor.push(bluebird.coroutine(function* () {
      throw new Error("i throw error :)")
    })))
    promises.push(push(promiseExecutor, promise, 6, expected))

    for (var j = 0; j < promises.length; j++) {
      var p = promises[j];
      p.then(function (r) {
        results.push(r)
        if (results.length == 7) {
          expect(result).to.be.eql(expected)
          expect(results).to.be.eql(['i am promise 1 arg1 1 arg2 1 arg3',
                                     'i am promise 2 arg1 2 arg2 2 arg3',
                                     {},
                                     'i am promise 3 arg1 3 arg2 3 arg3',
                                     'i am simple 4 arg1 4 arg2 4 arg3',
                                     'i am promise 5 arg1 5 arg2 5 arg3',
                                     'i am promise 6 arg1 6 arg2 6 arg3'])
          done()
        }
      }).catch(console.log)
    }
  })

  it('promise_1-promise_2-pronise_in_front_3-promise_4 should run in sequence of 3 1 2 4', function (done) {
    var expected = []
    var results  = []
    var promises = []
    var i        = 1
    promises.push(push(promiseExecutor, promise, 1, expected))
    promises.push(push(promiseExecutor, promise, 2, expected))
    promises.push(unshift(promiseExecutor, promise, 3, expected))
    promises.push(push(promiseExecutor, promise, 4, expected))
    var newExpected = [expected[4], expected[5], expected[0], expected[1], expected[2], expected[3], expected[6], expected[7]]
    for (var j = 0; j < promises.length; j++) {
      var p = promises[j];
      p.then(function (r) {
        results.push(r)
        if (results.length === 4) {
          expect(result).to.be.eql(newExpected)
          expect(results).to.be.eql(['i am promise 3 arg1 3 arg2 3 arg3',
                                     'i am promise 1 arg1 1 arg2 1 arg3',
                                     'i am promise 2 arg1 2 arg2 2 arg3',
                                     'i am promise 4 arg1 4 arg2 4 arg3'
                                    ])
          done()
        }
      }).catch(console.log)
    }
  })

  it("does not allow anything other than function", function () {
    expect(sequentialExecutor.push).withArgs(sequentialExecutor, "i am not a function.").to.throwException()
    expect(sequentialExecutor.push).withArgs(sequentialExecutor, /s/).to.throwException()
    expect(push).withArgs(promiseExecutor, promise, 1, []).to.not.throwException()
  })

  function* generatorExecutor(arg1, arg2, arg3) {
    result.push(`start ${this.name} ${arg1} ${arg2} ${arg3}`)
    yield bluebird.delay(50)
    result.push(`end ${this.name} ${arg1} ${arg2} ${arg3}`)
    return `${this.name} ${arg1} ${arg2} ${arg3}`
  }

  function simpleExecutor(arg1, arg2, arg3) {
    result.push(`start ${this.name} ${arg1} ${arg2} ${arg3}`)
    result.push(`end ${this.name} ${arg1} ${arg2} ${arg3}`)
    return `${this.name} ${arg1} ${arg2} ${arg3}`
  }

  function IAM(name) {
    this.name = name
  }

  function push(executor, iam, i, expected) {
    expected.push(`start ${iam.name} ${i} arg1 ${i} arg2 ${i} arg3`)
    expected.push(`end ${iam.name} ${i} arg1 ${i} arg2 ${i} arg3`)
    return sequentialExecutor.push(executor.bind(iam, i + ' arg1', i + ' arg2', i + ' arg3', i + 1))
  }

  function unshift(executor, iam, i, expected) {
    expected.push(`start ${iam.name} ${i} arg1 ${i} arg2 ${i} arg3`)
    expected.push(`end ${iam.name} ${i} arg1 ${i} arg2 ${i} arg3`)
    return sequentialExecutor.unshift(executor.bind(iam, i + ' arg1', i + ' arg2', i + ' arg3', i + 1))
  }
})