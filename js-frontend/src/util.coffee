import {sum} from 'd3-array'
#import qh from 'quickhull3d'

cloneOptions = (obj, newProps)->
  a = {}
  for k of obj
    a[k] = newProps[k] or obj[k]
  return a

computeCentroidAverage = (planes)->
  ###
  Compute centroid of a group of `PlaneData` instances
  using an average of all component measurement centers
  ###
  totalLength = 0
  accum = [0,0,0]
  weights = planes.map (plane)->
    d = plane.data
    if not d.centered_array?
      return [0,0,0]
    len = d.centered_array.length
    totalLength += len
    return d.center.map (a)->a*len

  overallCenter = [0..2].map (i)->
    d3.sum weights, (d)->d[i]/totalLength
  return overallCenter

computeCentroidExtrema = (planes)->
  extrema = [null, null, null]
  for p in planes
    for ext,ix in extrema
      c = p.data.center[ix]
      extrema[ix] = [c,c] if not ext?
      [min,max] = extrema[ix]
      if c < min
        extrema[ix][0] = c
      if c > max
        extrema[ix][1] = c
  extrema.map ([min, max])->
    (min+max)/2

export {cloneOptions, computeCentroidAverage, computeCentroidExtrema}
