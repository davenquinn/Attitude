import React from 'react'
import ReactDOM from 'react-dom'
import h from 'react-hyperscript'
import * as d3 from 'd3'
import {Stereonet, opacityByCertainty, globalLabels,chroma} from "../../src"
import {Switch} from "@blueprintjs/core"

class StereonetComponent extends React.Component
  @defaultProps: {
    onRotate: ->
    mode: 'planes'
    hovered: []
  }
  constructor: (props)->
    super props
  componentDidMount: ->
    {data} = @props
    @stereonet = Stereonet()
      .size(400)
      .margin(25)

    node = ReactDOM.findDOMNode(@)
    svg = d3.select(node)
      .call(@stereonet)

    @updateFeatureMode()

    @stereonet.call globalLabels()

    {onRotate, onHover} = @props
    @stereonet.on 'rotate.cb', ->
      onRotate @centerPosition()

  componentDidUpdate: (prevProps)->
    if prevProps.mode != @props.mode
      @updateFeatureMode()

    if prevProps.hovered != @props.hovered
      @updateHovered()

  updateHovered: ->
    console.log "Updating hovered on stereonet"
    {hovered, mode} = @props
    @stereonet.dataArea()
      .select 'g.hovered'
      .remove()

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

    return unless hovered?
    return if hovered.length == 0
    if mode == 'planes'
      @stereonet.planes(hovered, selector: 'g.hovered')
        .each ->
          d3.select @
            .select 'path.nominal'
            .remove()
        .each setHoveredFill
        .classed 'in-group', (d)->d.member_of?
        .classed 'is-group', (d)->d.members?
    else
      @stereonet.ellipses(hovered, selector: 'g.hovered')
        .each setHoveredFill
        .classed 'in-group', (d)->d.member_of?
        .classed 'is-group', (d)->d.members?

  updateFeatureMode: ->
    {mode, data, onHover} = @props
    c = (d) -> d.color

    @stereonet.dataArea()
      .select 'g.planes'
      .remove()

    @stereonet.dataArea()
      .select 'g.poles'
      .remove()

    if mode == 'planes'
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
    else
      @stereonet.ellipses(data)
        .each(opacityByCertainty(c, 'path.error'))
        .classed 'in-group', (d)->d.member_of?
        .classed 'is-group', (d)->d.members?
    @stereonet.draw()

    @stereonet.dataArea()
      .selectAll 'path.error'
      .on 'mouseenter', (d)->
        d = d3.select(@parentElement).datum()
        onHover d

    @updateHovered()

  render: ->
    h 'svg.stereonet'

class InteractiveStereonetComponent extends React.Component
  constructor: (props)->
    super props
    @state = {planeMode: true}
  render: ->
    {planeMode} = @state
    mode = if planeMode then "planes" else "poles"

    h 'div', [
      h StereonetComponent, {mode, @props...}
      h 'div.toolbar', [
        h 'input', {type: 'checkbox', checked: planeMode, onChange: @handleModeSwitch}
        h 'span', 'Planes'
      ]
    ]

  handleModeSwitch: =>
    @setState {planeMode: not @state.planeMode}

export {StereonetComponent, InteractiveStereonetComponent}
