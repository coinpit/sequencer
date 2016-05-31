# sequencer
executes promise in a sequence

```javascript

var sequencer = require('sequencer-js')()
var bluebird = require('bluebird')

var globalVariable = 1

function aPromise(id, ts) {
  return bluebird.delay(ts).then(function(){
     globalVariable++
    console.log(id, globalVariable)
  })
}

sequencer.push(aPromise.bind(undefined, "first", 1000))
sequencer.push(aPromise.bind(undefined, "second", 10))

```
