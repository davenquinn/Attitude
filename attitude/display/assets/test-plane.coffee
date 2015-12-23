d3 = require 'd3'
math = require './math'

# Test implementations of plane functions in javascript
obj = process.argv[2]

data = JSON.parse(obj)

val = math.planeErrors(
  data.singularValues, data.axes,
  n: data.n, sheet: data.sheet)

process.stdout.write JSON.stringify(data: val)

