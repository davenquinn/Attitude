fs = require 'fs'
d3 = require 'd3'

transpose = (array, length=null) ->
  unless length?
    length = array[0].length
  newArray = [0...length].map -> []
  for i in [0...array.length]
    for j in [0...length]
      newArray[j].push array[i][j]
  newArray

# Test implementations of plane functions in javascript
obj = process.argv[2]

data = JSON.parse(obj)

n = data.n
step = 2*Math.PI/(n-1)
angles = (i*step for i in [0...n])

cov = data.covariance
cT = transpose(cov.slice(0,2))
axes = transpose(data.axes)
#console.log cov

sdot = (a,b)->
  zipped = (a[i]*b[i] for i in [0..a.length])
  d3.sum zipped

sheets =
  upper: (d,i)->d+cov[2][i]
  lower: (d,i)->d-cov[2][i]

stepFunc = (angle)->
  a = [Math.cos(angle),Math.sin(angle)]
  e = (sdot(a,i) for i in cT)

  func = sheets[data.sheet]
  if func?
    e = e.map func

  d = (sdot(e,i) for i in axes)

  x = -d[2]
  y = d[0]
  z = d[1]
  sq = (a)->Math.pow(a,2)
  r = Math.sqrt(sq(x)+sq(y)+sq(z))
  lat = Math.asin(z/r)
  lon = Math.atan2(y,x)
  return [lon,lat]

val = angles.map(stepFunc)

process.stdout.write JSON.stringify(data: val)

