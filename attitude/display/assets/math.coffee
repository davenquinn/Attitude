d3 = require 'd3'

transpose = (array, length=null) ->
  unless length?
    length = array[0].length
  newArray = [0...length].map -> []
  for i in [0...array.length]
    for j in [0...length]
      newArray[j].push array[i][j]
  newArray

 identity = [[1,0,0],[0,1,0],[0,0,1]]

planeErrors = (singularValues, axes, opts)->
  n = opts.n or 100
  sheet = opts.sheet or 'nominal'
  axes = identity unless axes?

  step = 2*Math.PI/(n-1)
  angles = (i*step for i in [0...n])

  s = singularValues.map Math.sqrt
  axes = transpose(axes)

  sdot = (a,b)->
    zipped = (a[i]*b[i] for i in [0..a.length])
    d3.sum zipped

  stepFunc = (angle)->
    e = [Math.cos(angle)*s[0],
         Math.sin(angle)*s[1]]

    if sheet
      e[2] = s[2]
    else if sheet
      e[2] = -s[2]

    d = (sdot(e,i) for i in axes)

    sq = (a)->a*a
    r = Math.sqrt d3.sum d.map(sq)
    return [
      Math.atan2(d[0],-d[2]),
      Math.asin d[1]/r]

  return angles.map(stepFunc)

module.exports =
  planeErrors: planeErrors
  transpose: transpose

