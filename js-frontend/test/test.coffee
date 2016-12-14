{assert} = require 'chai'
{exec} = require 'child_process'

describe '`Attitude` python module', ->
  it 'should be importable', (done)->
    exec 'python -c "import attitude"', (err,stdout, stderr)->
      if err?
        done(err)
      else done()

describe 'math module', ->
  it 'should be importable', ->
    o = require '../src/math'

