import React from 'react'
import ReactDOM from 'react-dom'
import h from 'react-hyperscript'
import * as M from 'mathjs'

import * as d3 from 'd3'
import {opacityByCertainty,chroma} from "../../src"
import {hyperbolicErrors, apparentDip, digitizedLine, PlaneData, fixAngle} from "../../src"
import {computeCentroidExtrema} from '../../src/util'

darkenColor = (c)->
  chroma(c).darken(2).css()

fmt = d3.format '.0f'

class SideViewComponent extends React.Component
  @defaultProps: {
    hovered: [{uid:''}]
  }
  constructor: (props)->
    super props
  componentDidMount: ->
    {data} = @props

    for f in data
      f.is_group = f.members?

    @singlePlanes = data
      .filter (d)->not d.is_group
      .map (d)->new PlaneData d

    overallCenter = computeCentroidExtrema(@singlePlanes)

    xsize = 0
    ysize = 0

    for p in @singlePlanes
      p.offset = M.subtract(p.mean, overallCenter)
      [x,y,z] = M.abs(p.offset)
      if z > ysize
        ysize = z
      hyp = Math.hypot(x,y)
      if hyp > xsize
        xsize = h

      p.inGroup = false
      if p.data.member_of?
        group = data.find (d)->d.uid == p.data.member_of
        if group?
          p.group = new PlaneData group, p.mean
          p.group.offset = p.offset
          p.inGroup = true

    xsize *= 1.1
    ysize *= 1.1
    console.log xsize,ysize

    margin = 30
    marginLeft = 50
    marginRight = 100
    marginTop = 5
    marginBottom = 35
    sz = {width: 800, height: 300}
    innerSize =
      width: sz.width-marginLeft-marginRight
      height: sz.height-marginTop-marginBottom

    @svg = d3.select ReactDOM.findDOMNode(@)
      .at sz
      .append 'g'
      .at transform: "translate(#{marginLeft},#{marginTop})"

    x = d3.scaleLinear()
      .range [0,innerSize.width]
      .domain [-xsize, xsize]

    y = d3.scaleLinear()
      .range [innerSize.height,0]
      .domain [-ysize, ysize]

    dataArea = @svg.append 'g.data'

    ### Setup data ###

    @errorContainer = dataArea.append 'g.errors'
    @errorContainerGrouped = dataArea.append 'g.errors-grouped'
    @planeContainer = dataArea.append 'g.planes'

    setScale = (scale, mPerPx)->
      r = scale.range()
      w = r[1]-r[0]
      mWidth = Math.abs(w*mPerPx)
      scale.domain [-mWidth/2,mWidth/2]

    # For 1:1
    yRatio = Math.abs(1/(y(1)-y(0)))
    xRatio = Math.abs(1/(x(1)-x(0)))

    if xRatio > yRatio
      setScale(y, xRatio)
    else
      setScale(x, yRatio)

    @lineGenerator = d3.line()
      .x (d)->x(d[0])
      .y (d)->y(d[1])

    ### Setup axes ###
    axes = @svg.append 'g.axes'

    yA = d3.scaleLinear()
      .domain y.domain().map (d)->d+overallCenter[2]
      .range y.range()

    yAx = d3.axisLeft yA
      .tickFormat fmt
      .tickSizeOuter 0

    axes.append 'g.y.axis'
      .call yAx
      .append 'text.axis-label'
      .text 'Elevation (m)'
      .attr 'transform', "translate(-40,#{innerSize.height/2}) rotate(-90)"
      .style 'text-anchor','middle'

    __domain = x.domain()
    __dw = (__domain[1]-__domain[0])

    xA = d3.scaleLinear()
      .domain [0,__dw]
      .range x.range()

    xAx = d3.axisBottom xA
      .tickFormat fmt
      .tickSizeOuter 0

    _x = axes.append 'g.x.axis'
      .translate [0,innerSize.height]
      .call xAx

    @azLabel = _x.append 'text.axis-label'
      .attr 'transform', "translate(#{innerSize.width/2},24)"
      .style 'text-anchor','middle'

    @scales = {x,y}

    @componentDidUpdate()

  componentDidUpdate: (prevProps={})->
    if prevProps.azimuth != @props.azimuth
      @updateAzimuth()
    if prevProps.hovered != @props.hovered
      @updateHovered()

  updateAzimuth: ->
    console.log "Updated constraints"
    angle = @props.azimuth - Math.PI/2
    {x,y} = @scales

    v_ = M.eye(3).toArray()
    hyp = hyperbolicErrors(angle, v_, x,y)
      .width(150)
      .nominal(false)

    if not @svg.select('#gradient').node()
      @errorContainer.call hyp.setupGradient

    # Individual data
    ## We have some problems showing large error angles
    sel = @errorContainer
      .selectAll 'g.error-hyperbola'
      .data @singlePlanes

    esel = sel.enter()
      .append 'g.error-hyperbola'
      .classed 'in-group', (d)->d.group?

    esel.merge(sel)
        .each hyp
        .sort (a,b)->a.__z-b.__z

    # Grouped data
    gp = @singlePlanes.filter (d)->d.group?
            .map (d)->d.group

    sel = @errorContainerGrouped
      .selectAll 'g.error-hyperbola'
      .data gp
    esel = sel.enter()
      .append 'g.error-hyperbola'
    esel.merge(sel)
        .each hyp
        .sort (a,b)->a.__z-b.__z

    dataWithTraces = @singlePlanes.filter (d)->d.centered?
    se = @planeContainer
      .selectAll 'path.trace'
      .data dataWithTraces

    {onHover} = @props
    ese = se.enter()
      .append 'path.trace'
      .attr 'stroke', (d)->darkenColor(d.color)
      .on 'mouseover', (d)->
        onHover(d.data)

    df = digitizedLine(angle, @lineGenerator)
    ese.merge(se).each df

    az = fmt(fixAngle(angle+Math.PI)*180/Math.PI)
    @azLabel.text "Distance along #{az}º"

  updateHovered: ->
    {hovered} = @props
    return unless hovered?
    hoveredIDs = hovered.map (d)->d.uid
    @planeContainer
      .selectAll 'path.trace'
      .attr 'stroke', (v)->
        c = darkenColor(v.color)
        if hoveredIDs.indexOf(v.data.uid) != -1
          c = v.color
        return c

  render: ->
    h 'svg.horizontal-area'

export {SideViewComponent}

