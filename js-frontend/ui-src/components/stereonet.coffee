import React from 'react'
import ReactDOM from 'react-dom'
import h from 'react-hyperscript'
import * as d3 from 'd3'
import {Stereonet, opacityByCertainty, globalLabels,chroma} from "../../src"
import {Switch, Button} from "@blueprintjs/core"

setHoveredFill = (d) ->
  s = d3.select @
  err = s.select 'path.error'
  err.styles
    'fill': d.color
    'stroke': d.color
    'fill-opacity': 0.1
  s.select('path.nominal')
    .style 'stroke', d.color
  return if d.member_of?
  err.styles
    'fill-opacity': 0.5

class StereonetComponent extends React.Component
  @defaultProps: {
    onRotate: ->
    mode: 'planes'
    drawPlanes: true
    drawPoles: false
    hovered: []
    precision: 0.2
    center: [0,0]
  }
  constructor: (props)->
    super props
    @state = {center: @props.center}

  componentDidMount: ->
    {data, center, precision} = @props
    @stereonet = Stereonet()
      .size(400)
      .margin(25)

    @stereonet.projection()
      .precision(precision)

    node = ReactDOM.findDOMNode(@)
    svg = d3.select(node)
      .call(@stereonet)

    @updatePoles()
    @updatePlanes()
    @__finishUpdate()

    @stereonet.call globalLabels()
    @stereonet.on 'rotate.cb', =>
      center = @stereonet.centerPosition()
      #@setState {center}
      @props.onRotate center

  componentDidUpdate: (prevProps)->
    {hovered} = @props
    if prevProps.drawPlanes != @props.drawPlanes
      @updatePlanes()
      hovered = null

    if prevProps.drawPoles != @props.drawPoles
      @updatePoles()
      hovered = null
    @__finishUpdate()
    if prevProps.hovered != hovered
      @updateHovered()

  updateHovered: ->
    console.log "Updating hovered on stereonet"
    {hovered, drawPlanes, drawPoles} = @props
    @stereonet.dataArea()
      .select 'g.hovered'
      .remove()
    return unless hovered?
    return if hovered.length == 0
    if drawPlanes
      @stereonet.planes(hovered, selector: 'g.hovered')
        .each ->
          d3.select @
            .select 'path.nominal'
            .remove()
        .each setHoveredFill
        .classed 'in-group', (d)->d.member_of?
        .classed 'is-group', (d)->d.members?
    if drawPoles
      @stereonet.ellipses(hovered, selector: 'g.hovered')
        .each setHoveredFill
        .classed 'in-group', (d)->d.member_of?
        .classed 'is-group', (d)->d.members?

  updatePlanes: ->
    {data, onHover, drawPlanes} = @props
    c = (d) -> d.color

    @stereonet.dataArea()
      .select 'g.planes'
      .remove()
    return unless drawPlanes

    @stereonet.planes(data)
      .each(opacityByCertainty(c, 'path.error'))
      .classed 'in-group', (d)->d.member_of?
      .classed 'is-group', (d)->d.members?
      .each (d) ->
        if d.max_angular_error > 45
          d3.select @
            .select 'path.error'
            .remove()

        d3.select @
          .select('path.nominal')
          .attr 'stroke', d.color

  updatePoles: ->
    {data, onHover, drawPoles} = @props
    c = (d) -> d.color

    @stereonet.dataArea()
      .select 'g.poles'
      .remove()
    return unless drawPoles

    @stereonet.ellipses(data)
      .each(opacityByCertainty(c, 'path.error'))
      .classed 'in-group', (d)->d.member_of?
      .classed 'is-group', (d)->d.members?


  __finishUpdate: ->
    {onHover} = @props
    @stereonet.draw()
    @stereonet.dataArea()
      .selectAll 'path.error'
      .on 'mouseenter', (d)->
        d = d3.select(@parentElement).datum()
        onHover d

  render: ->
    h 'svg.stereonet'

class InteractiveStereonetComponent extends React.Component
  constructor: (props)->
    super props
    @state = {drawPlanes: true, drawPoles: false, center: [0,0]}
  render: ->
    {drawPlanes, drawPoles, center} = @state

    h 'div', [
      h StereonetComponent, {
        drawPlanes, drawPoles, @props..., center
        ref: "component"
      }
      h 'div.toolbar', [
        h Switch, {checked: drawPlanes, onChange: @handleSwitchPlanes, label: 'Planes'}
        h Switch, {checked: drawPoles, onChange: @handleSwitchPoles, label: 'Poles'}
        h Button, {onClick: @setVertical, className: 'pt-small'}, "Vertical"
      ]
    ]

  setVertical: =>
    console.log "Want to set vertical"

  handleSwitchPoles: =>
    @setState {drawPoles: not @state.drawPoles}
  handleSwitchPlanes: =>
    @setState {drawPlanes: not @state.drawPlanes}


export {StereonetComponent, InteractiveStereonetComponent}
