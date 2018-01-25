import React from 'react'
import ReactDOM from 'react-dom'
import h from 'react-hyperscript'
import * as d3 from 'd3'
import {Stereonet, opacityByCertainty, globalLabels,chroma} from "../../src"

class StereonetComponent extends React.Component
  @defaultProps: {
    onRotate: ->
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

    c = (d) ->
      d.color

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

    @stereonet.call globalLabels()
    @stereonet.draw()

    {onRotate, onHover} = @props
    @stereonet.on 'rotate.cb', ->
      onRotate @centerPosition()

    svg.selectAll 'g.planes g.plane path.error'
      .on 'mouseenter', (d)->
        d = d3.select(@parentElement).datum()
        onHover d

  componentDidUpdate: (prevProps)->
    if prevProps.hovered != @props.hovered
      @updateHovered()

  updateHovered: ->
    console.log "Updating hovered on stereonet"
    {hovered} = @props
    @stereonet.dataArea()
      .select 'g.hovered'
      .remove()
    return unless hovered?
    @stereonet.planes([hovered], selector: 'g.hovered')
      .each (d) ->
        s = d3.select @
        s.select 'path.error'
          .attrs
            fill: d.color
            'fill-opacity': 0.5
        s.select('path.nominal')
          .attr 'stroke', d.color

  render: ->
    h 'svg.stereonet'

export {StereonetComponent}
