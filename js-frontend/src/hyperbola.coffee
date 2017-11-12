M = require 'mathjs'
Q = require 'quaternion'
d3 = require 'd3'
require 'd3-jetpack'
import chroma from 'chroma-js'
import * as math from './math.coffee'
import {opacityByCertainty} from './stereonet'

## Matrix to map down to 2 dimensions
T = M.matrix [[1,0],[0,0],[0,1]]

matrix = (obj)->
  if obj instanceof Q
    ## We're dealing with a quaternion,
    # need to convert to rotation matrix
    obj = obj.toMatrix(true)
  M.matrix(obj)

dot = (...args)->
  # Multiply matrices, ensuring matrix form
  M.multiply args.map(matrix)...

transpose = (m)->M.transpose matrix m

vecAngle = (a0,a1)->
  a0_ = M.divide(a0,M.norm(a0))
  a1_ = M.divide(a1,M.norm(a1))
  return dot(a0_,a1_)

apparentDipCorrection = (screenRatio=1)->
  (axes2d)->
    # Correct for apparent dip
    a0 = axes2d[1]
    a1 = [0,1]
    a0 = M.divide(a0,M.norm(a0))
    a1 = M.divide(a1,M.norm(a1))
    cosA = dot(a0,a1)
    angle = Math.atan2(Math.tan(Math.acos(cosA)),screenRatio)
    return angle*180/Math.PI

hyperbolicErrors = (viewpoint, axes, lineGenerator, xScale,yScale)->
  n = 10
  angle = viewpoint
  dfunc = (d)->
    # Get a single level of planar errors (or the
    # plane's nominal value) as a girdle

    q = Q.fromAxisAngle [0,0,1], angle+Math.PI

    R = matrix(axes)
    ax = dot(M.transpose(R), d.axes, R)
    a0 = ax.toArray()[0]
    q1 = Q.fromBetweenVectors [1,0,0], [a0[0],a0[1],0]
    a1 = M.acos(vecAngle([a0[0],a0[1],0],[1,0,0]))


    ## Matrix to map down to 2 dimensions
    T = M.matrix [[1,0],[0,0],[0,1]]


    ### Project axes to 2d ###
    s = M.sqrt(d.lengths).map (d)->1/d
    v = [s[0]*Math.cos(angle - a1)
         s[1]*Math.sin(angle - a1)
         s[2]]
    a = 1/M.norm([v[0],v[1]])
    b = 1/M.abs(v[2])
    #if b > a
    #  [a,b] = [b,a]
    #console.log a,b

    #a = M.norm([e[0],e[1]])
    #b = e[2]

    # Major axes of the conic sliced in the requested viewing
    # geometry
    # Semiaxes of hyperbola
    cutAngle = Math.atan2(b,a)
    angularError = cutAngle*2*180/Math.PI
    console.log "Error: ", angularError

    angles = [0...n].map (d)->
      cutAngle+(d/n*(Math.PI-cutAngle))+Math.PI/2

    ## We will transform with svg functions
    ## so we can neglect some of the math
    # for doing hyperbolae not aligned with the
    # coordinate plane.

    #arr = transpose [
      #M.multiply(M.tan(angles),a)
      #M.cos(angles).map (v)->b/v
    #]
    #sign = if arr.get([0,1]) < 0 then -1 else 1

    largeNumber = 100000
    limit = b/a*largeNumber

    coords  = [
      [-largeNumber,limit]
      [0,b]
      [largeNumber,limit]
    ]
    #coords.push [-largeNumber,limit]

    #__angles = [M.cos(a),M.sin(a)]
    #for c in coords
      #c[0] *= __angles[0]
      #c[1] *= __angles[1]

    # Correction for angle and means go here
    # unless managed by SVG transforms
    top = coords.map ([x,y])->[x,-y]
    top.reverse()

    poly = coords.concat top

    # Translate
    offs = dot(d.offset,R,q).toArray()
    center = [xScale(offs[0])-xScale(0),yScale(offs[2])-yScale(0)]
    # Used for positioning, but later
    d.__z = offs[1]

    oa = opacityByCertainty(->d.color)
      .angularError -> angularError
      .max 10


    # Correct for apparent dip
    screenRatio = Math.abs((xScale(1)-xScale(0))/(yScale(1)-yScale(0)))
    apparent = apparentDipCorrection(screenRatio)

    RQ =  dot(R,q1,q,T)
    # grouped transform
    aT = dot(M.transpose(RQ),ax,RQ).toArray()
    console.log aT[1]

    __angle = apparent(aT)#+apparent(RQT) #apparent for grouped transform
    if aT[1][0] > 0
      __angle *= -1
    #console.log 'Angle', __angle
    #__angle = 0
    ## Start DOM manipulation ###
    d3.select(@)
      .selectAppend 'path.hyperbola'
      .datum poly
      .attr 'd', (v)->lineGenerator(v)+"Z"
      .attr 'transform', "translate(#{-center[0]},#{-center[1]})rotate(#{__angle},#{xScale(0)},#{yScale(0)})"
      .each oa

digitizedLine = (viewpoint, axes=M.eye(3))->(d)->
  angle = viewpoint
  ### Create a line from input points ###
  ### Put in axis-aligned coordinates ###
  q = Q.fromAxisAngle [0,0,1], angle+Math.PI
  #a0 = d.axes[0]
  #q1 = Q.fromBetweenVectors [1,0,0], [a0[1],a0[0],0]
  #q = q.add q1

  R = M.transpose matrix(axes)
  alignedWithGroup = dot(d.centered, R)
  offs = dot(d.offset,R)
  v = alignedWithGroup.toArray()
    .map (row)-> M.add(row,offs)

  a0 = R.toArray()[0]
  a1 = [a0.slice(0,2)..., 0]
  ### Apparent dip correction ###
  A = Q.fromBetweenVectors a0, a1

  #R2 = q.mul(A).mul(N)
  a =dot(v, q)

  ### Map down to two dimensions (the x-z plane of the viewing geometry) ###

  ## Rotation ###
  #M.matrix(q.toMatrix(true))

  dot(a, T).toArray()

export {hyperbolicErrors, digitizedLine}

