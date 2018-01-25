import {Stereonet, opacityByCertainty, globalLabels,chroma} from "../src"
import {hyperbolicErrors, apparentDip, digitizedLine, PlaneData, fixAngle} from "../src"
import style from './ui-styles.styl'
import {StereonetComponent} from './components/stereonet'
import {SideViewComponent} from './components/side-view'
import h from 'react-hyperscript'
import ReactDOM from 'react-dom'
import React from 'react'

class AngularMeasurement extends React.Component
  render: ->
    {label, datum} = @props
    datum ?= ''
    h 'li', [
      label
      h 'span.data', datum
      'º'
    ]

class PlaneDescriptionControl extends React.Component
  render: ->
    {attitude} = @props
    if not attitude?
      return h 'div.plane-desc', {style: {display: 'none'}}
    return h 'div.plane-desc', [
      h 'h3.data-id', [
        "ID: "
        h 'span.data.id'
      ]
      h 'h4', 'Nominal Plane'
      h 'ul', [
        h AngularMeasurement, {label: 'Strike: '}
        h AngularMeasurement, {label: 'Dip:    '}
      ]
      h 'h4', 'Angular errors'
      h 'ul', [
        h AngularMeasurement, {label: 'Min: '}
        h AngularMeasurement, {label: 'Max: '}
      ]
    ]

class AttitudeUI extends React.Component
  @defaultProps: {width: 800, attitudes: []}
  constructor: (props)->
    super props
    @state = {
      azimuth: 0
    }
  render: ->
    {attitudes} = @props
    {azimuth} = @state
    data = attitudes

    h 'div.attitude-area', [
      h 'div.row', [
        h StereonetComponent, {
          data,
          onRotate: @onStereonetRotate
        }
        h PlaneDescriptionControl
      ]
      h SideViewComponent, {data, azimuth}
      h 'div.collected-ids'
    ]

  onStereonetRotate: (pos)=>
    console.log pos
    [lon,lat] = pos
    azimuth = -Math.PI/180*lon
    @setState {azimuth}

createUI = (__base) ->
  data = __base.datum()
  ###
  Stereonet
  ###

  el = h AttitudeUI, {attitudes: data}
  ReactDOM.render(el, __base.node())

  return

  darkenColor = (c)->
    chroma(c).darken(2).css()

  fmt = d3.format '.0f'

  updateSelected = (d)->
    planeContainer
      .selectAll 'path.trace'
      .attr 'stroke', (v)->
        c = darkenColor(v.color)
        if not d?
          return c
        if v.data.uid == d.uid
          c = v.color
        return c

    dA = __base.select "div.attitude-data div.plane-desc"

    stereonet.dataArea()
      .select 'g.hovered'
      .remove()

    if not d?
      dA.style 'display','none'
      return

    stereonet.planes([d], selector: 'g.hovered')
      .each (d) ->
        s = d3.select @
        s.select 'path.error'
          .attrs
            fill: d.color
            'fill-opacity': 0.5

        s.select('path.nominal')
          .attr 'stroke', d.color

    dA.style 'display','block'

    dA.select "span.id"
      .text d.uid

    updateValue = (id,num)->
      dA.select "span.#{id}"
        .text fmt(num)

    updateValue('strike',d.strike)
    updateValue('dip',d.dip)
    updateValue('min',d.min_angular_error)
    updateValue('max',d.max_angular_error)

  svg
    .selectAll 'g.planes g.plane path.error'
    .on 'mouseenter', (d)->
      d = d3.select(@parentElement).datum()
      updateSelected d
    .on 'click', (d)->
      d = d3.select(@parentElement).datum()
      collectID d.data.uid

  d3.select(".attitude-area").on 'mouseleave', ->updateSelected()

  ###
  Horizontal
  ###

  ### Update data after setup ###

  ### Collected ids ###
  collectedIDs = []
  collectID = (id)->
    console.log id
    ix = collectedIDs.indexOf(id)
    console.log ix
    if ix == -1
      collectedIDs.push(id)
    else
      collectedIDs.splice ix,1
    cid = collectedIDs.map (v)-> "\"#{v}\""
    console.log cid.join(',')
    __base.select '.collected-ids'
      .text "[#{cid.join(',')}]"

export {createUI}
