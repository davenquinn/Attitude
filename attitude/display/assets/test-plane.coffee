d3 = require 'd3'
math = require './math'

# Test implementations of plane functions in javascript
obj = process.argv[2]

data = JSON.parse(obj)

val = data.map (d)->
  math.planeErrors(d.singularValues, d.axes, d)

process.stdout.write JSON.stringify(val)

