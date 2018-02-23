import M from 'mathjs'
import Q from 'quaternion'
import {mean} from 'd3-array'
import {line} from 'd3-shape'
import * as d3 from 'd3'
import 'd3-selection-multi'
import 'd3-jetpack'
import chroma from 'chroma-js'
import * as math from './math.coffee'
import {opacityByCertainty} from './stereonet'
import uuid from 'uuid'

select = d3.select

## Matrix to map down to 2 dimensions
T = M.matrix [[1,0],[0,0],[0,1]]

fixAngle = (a)->
  # Put an angle on the interval [-Pi,Pi]
  while a > Math.PI
    a -= 2*Math.PI
  while a < -Math.PI
    a += 2*Math.PI
  return a

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
    #a0 = M.divide(a0,M.norm(a0))
    #a1 = M.divide(a1,M.norm(a1))
    cosA = dot(a0,a1)
    console.log "Axes",a0, cosA
    angle = Math.atan2(
      Math.tan(Math.acos(cosA/(M.norm(a0)*M.norm(a1))))
      screenRatio)
    return angle*180/Math.PI

scaleRatio = (scale)->
  scale(1)-scale(0)

getRatios = (x,y)->
  # Ratios for x and y axes
  ratioX = scaleRatio(x)
  ratioY = scaleRatio(y)
  screenRatio = ratioX/ratioY

  lineGenerator = line()
    .x (d)->d[0]*ratioX
    .y (d)->d[1]*ratioY

  {ratioX, ratioY, screenRatio, lineGenerator}

__planeAngle = (axes, angle)->
  # Get angle of the plane from the major axes
  a0 = axes.toArray()[0]
  angle - M.acos(vecAngle([a0[0],a0[1],0],[1,0,0]))

hyperbolicErrors = (viewpoint, axes, xScale,yScale)->
  # Viewpoint should be an angle from north in radians
  n = 10
  angle = viewpoint
  gradient = null
  width = 400
  nominal = false
  centerPoint = false
  alphaScale = null
  # Whether to exaggerate error angles along with scale
  scaleErrorAngles = true

  # For 3 coordinates on each half of the hyperbola, we collapse down to
  # a special case where no trigonometry outside of tangents have to be calculated
  # at each step. This is much more efficient, at the cost of the fine structure
  # of the hyperbola near the origin
  nCoords = 3
  {ratioX,ratioY,screenRatio, lineGenerator} = getRatios(xScale, yScale)

  dfunc = (d)->
    # Get a single level of planar errors (or the
    # plane's nominal value) as a girdle

    rax = d.axes
    if rax[2][2] < 0
      rax = rax.map (row)->row.map (i)->-i

    q = Q.fromAxisAngle [0,0,1], angle+Math.PI

    R = matrix(axes)
    ax = dot(M.transpose(R), d.axes, R)
    a1 = __planeAngle(ax,angle)

    ## Matrix to map down to 2 dimensions
    T = M.matrix [[1,0],[0,0],[0,1]]

    ### Project axes to 2d ###
    s = M.sqrt(d.lengths).map (d)->1/d
    v = [s[0]*Math.cos(a1)
         s[1]*Math.sin(a1)
         s[2]]
    a = 1/M.norm([v[0],v[1]])
    b = 1/M.abs(v[2])

    #a = M.norm([e[0],e[1]])
    #b = e[2]

    # Major axes of the conic sliced in the requested viewing
    # geometry
    # Semiaxes of hyperbola
    cutAngle = Math.atan2(b,a)
    angularError = cutAngle*2*180/Math.PI
    if angularError > 90
      ## This plane has undefined errors
      hyp = select(@)
        .attr('visibility','hidden')
      return

    # find length at which tangent is x long
    lengthShown = width/2

    if scaleErrorAngles
      cutAngle2 = Math.atan2(b,a*screenRatio)
    else
      cutAngle2 = cutAngle
    inPlaneLength = lengthShown * Math.cos cutAngle2

    ## We will transform with svg functions
    ## so we can neglect some of the math
    # for hyperbolae not aligned with the
    # coordinate plane.
    if nCoords > 3
      angles = [0...n].map (d)->
        cutAngle+(d/n*(Math.PI-cutAngle))+Math.PI/2

      arr = transpose [
        M.multiply(M.tan(angles),a)
        M.cos(angles).map (v)->b/v
      ]
    else
      arr = [[0,b]]

    largeNumber = width/ratioX
    limit = b/a*largeNumber

    coords  = [
      [-largeNumber,limit]
      arr...
      [largeNumber,limit]
    ]

    # Correction for angle and means go here
    # unless managed by SVG transforms
    top = coords.map ([x,y])->[x,-y]
    top.reverse()

    poly = coords.concat top

    # Translate
    d.offset ?= [0,0,0]
    if d.offset.length == 3
      offs = dot(d.offset,R,q).toArray()
      zind = offs[1]
      loc = [offs[0], offs[2]]
      center = [xScale(loc[0])-xScale(0),yScale(loc[1])-yScale(0)]
      translate = [-center[0]+xScale(0),yScale(0)+center[1]]
    else
      loc = d.offset
      zind = 1
      translate = [xScale(loc[0]),yScale(loc[1])]
    # Used for positioning, but later
    d.__z = zind

    oa = opacityByCertainty(->d.color)
      .angularError -> angularError
      .max 5

    if alphaScale?
      oa.alphaScale alphaScale

    # Correct for apparent dip
    #apparent = apparentDipCorrection(screenRatio)

    # grouped transform
    v = d.apparentDip(-angle+Math.PI/2)
    v = -Math.atan2(Math.tan(v),screenRatio)*180/Math.PI
    #if aT[1][0]*aT[1][1] < 0
      #__angle *= -1
    #console.log 'Angle', __angle
    #__angle = 0

    if not scaleErrorAngles
      lineGenerator = line()
        .x (d)->d[0]*ratioX
        .y (d)->d[1]*ratioX

    ## Start DOM manipulation ###
    hyp = select(@)
      .attr 'visibility','visible'
      .attr 'transform', "translate(#{translate[0]},#{translate[1]})
                          rotate(#{v})"

    hyp.classed 'in_group', d.inGroup

    lim = width/2
    lim = Math.abs inPlaneLength
    masksz = {x:-lim,y:-lim,width:lim*2,height: lim*2}

    mask = hyp.select('mask')
    mid = null
    if not mask.node()
      mid = uuid.v4()
      mask = hyp.append 'mask'
        .attr 'id', mid
        .attrs masksz
        .append 'rect'
        .attrs {masksz..., fill: "url(#gradient)"}
    if not mid?
      mid = mask.attr('id')

    if centerPoint
      hyp.selectAppend 'circle'
        .attrs r: 2, fill: 'black'

    hyp.selectAppend 'path.hyperbola'
      .datum poly
      .attr 'd', (v)->lineGenerator(v)+"Z"
      .each oa
      .attr 'mask', "url(##{mid})"

    #if nominal
      #hyp.selectAppend 'line.nominal'
        #.attrs x1: -largeNumber, x2: largeNumber
        #.attr 'stroke', '#000000'

  dfunc.setupGradient = (el)->
    defs = el.append 'defs'

    g = defs.append 'linearGradient'
        .attr 'id', 'gradient'

    stop = (ofs, op)->
      a = Math.round(op*255)
      g.append 'stop'
        .attrs {
          offset: ofs
          'stop-color': "rgb(#{a},#{a},#{a})"
          'stop-opacity': op
         }

    stop(0,0)
    stop(0.2,0.1)
    stop(0.45,1)
    stop(0.55,1)
    stop(0.8,0.1)
    stop(1,0)

  dfunc.scaleErrorAngles = (o)->
    return scaleErrorAngles unless o?
    scaleErrorAngles = o
    return dfunc

  dfunc.width = (o)->
    return width unless o?
    width = o
    return dfunc

  dfunc.nominal = (o)->
    return nominal unless o?
    nominal = o
    return dfunc

  dfunc.alphaScale = (o)->
    return alphaScale unless o?
    alphaScale = o
    return dfunc

  return dfunc

digitizedLine = (viewpoint, lineGenerator)->
  axes=M.eye(3)
  f = (d)->
    ### Create a line from input points ###
    ### Put in axis-aligned coordinates ###
    q = Q.fromAxisAngle [0,0,1], viewpoint
    R = M.transpose matrix(axes)
    alignedWithGroup = dot(d.centered, R)
    offs = dot(d.offset,R)
    v = alignedWithGroup.toArray()
      .map (row)-> M.add(row,offs)
    a = dot(v, q)
    ### Map down to two dimensions (the x-z plane of the viewing geometry) ###
    data = dot(a, T).toArray()

    select(@).attr 'd', lineGenerator(data)

  f.axes = (o)->
    return axes unless o?
    axes = o
    return f

  return f

apparentDip = (viewpoint, xScale,yScale)->
  axes = M.eye(3)
  {ratioX,ratioY,screenRatio, lineGenerator} = getRatios(xScale, yScale)

  #if not axes?
  f = (d)->

    #select @
      #.attr 'd',lineGenerator(lineData)
      #.attr 'transform', "translate(#{xScale(offs[0])},#{yScale(offs[2])})rotate(#{v})"

    plane = d
    if d.group?
      plane = d.group
    ### Create a line from input points ###
    ### Put in axis-aligned coordinates ###
    q = Q.fromAxisAngle [0,0,1], viewpoint

    angle = viewpoint #-viewpoint+Math.PI/2
    cv = Math.cos(angle)
    sv = Math.sin(angle)
    Ra = matrix([[cv,-sv,0],[sv,cv,0],[0,0,1]])

    A = matrix(plane.axes)

    # Without adding this other quaternion, it is the same as just showing
    # digitized lines

    #trans = dot(M.transpose(Ra), M.transpose(A), Ra)

    v = dot(d.centered, M.transpose(A), Ra)

     ### Map down to two dimensions (the x-z plane of the viewing geometry) ###
    data = dot(v, T).toArray()

    # Get offset of angles
    offs = dot(d.offset,q,T).toArray()

    v = plane.apparentDip(-viewpoint+Math.PI/2)
    v = -Math.atan2(Math.tan(v),screenRatio)*180/Math.PI

    select(@)
      .attr 'd', lineGenerator(data)
      .attr 'transform', "translate(#{xScale(offs[0])},#{yScale(offs[1])}) rotate(#{v})"


  f.axes = (o)->
    return axes unless o?
    axes = o
    return f

  return f

class PlaneData
  constructor: (data, mean=null)->
    {axes, hyperbolic_axes, extracted, color} = data
    @mean = mean or data.mean or data.center
    @axes = data.axes
    @color = color
    @lengths = hyperbolic_axes
    @inGroup = data.in_group
    @array = extracted
    @data = data
    @centered = data.centered_array

    # If we didn't pass a mean, we have to compute one
    return unless @array?
    ## Extract mean of data on each axis ##
    if not @mean?
      @mean = [0..2].map (i)=> mean @array, (d)->d[i]
    if not @centered?
      @centered = @array.map (d)=>M.subtract(d,@mean)

  dip: =>
    n = @axes[2]
    r = M.norm(n)
    dip = M.acos(n[2]/r)
    dipDr = fixAngle(Math.atan2(n[0],n[1]))
    return [dip,dipDr]

  apparentDip: (azimuth)=>
    n = @axes[2]
    r = M.norm(n)
    [dip,dipDr] = @dip()
    dipDr = Math.atan2(n[0],n[1])
    a = fixAngle(azimuth-dipDr)
    sign = if -Math.PI/2 < a or Math.PI/2 > a then 1 else -1
    d = M.tan(dip)*M.cos(azimuth-dipDr)
    sign*Math.atan(d)

export {hyperbolicErrors, digitizedLine, PlaneData, fixAngle,
        apparentDip, dot, chroma}

