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

planeErrors = (singularValues, axes, opts={})->
  n = opts.n or 100
  sheet = opts.sheet or 'nominal'
  degrees = opts.degrees or false
  axes = identity unless axes?

  step = 2*Math.PI/(n-1)
  angles = (i*step for i in [0...n])

  s = singularValues.map Math.sqrt
  axes = transpose(axes)

  sdot = (a,b)->
    zipped = (a[i]*b[i] for i in [0..a.length])
    d3.sum zipped

  c = if degrees then 180/Math.PI else 1

  c1 = if axes[2][2] > 0 then 1 else -1

  stepFunc = (angle)->
    e = [Math.cos(angle)*s[0],
         Math.sin(angle)*s[1]]

    if sheet == 'upper'
      e[2] = s[2]*c1
    else if sheet == 'lower'
      e[2] = -s[2]*c1

    d = (sdot(e,i) for i in axes)

    sq = (a)->a*a
    r = Math.sqrt d3.sum d.map(sq)
    return [
      c*Math.atan2(d[0],-d[2]),
      c*Math.asin d[1]/r]

  return angles.map(stepFunc)

combinedErrors = (sv, ax, opts={})->
  func = (type)->
    opts.sheet = type
    opts.degrees = true
    planeErrors sv, ax, opts

  out =
    nominal: func('nominal')
    upper: func('upper')
    lower: func('lower')

module.exports =
  planeErrors: planeErrors
  combinedErrors: combinedErrors
  transpose: transpose

