import h from 'react-hyperscript'
import ReactDOM from 'react-dom'
import React from 'react'
import {format} from 'd3'

fmt = format '3.1f'

class AngularMeasurement extends React.Component
  render: ->
    {label, datum} = @props
    datum ?= ''
    h 'li', [
      label
      h 'span.data', fmt(datum)
      'º'
    ]

class DataPanelComponent extends React.Component
  render: ->
    {attitude, selection} = @props
    if (not attitude? or attitude.length == 0)
      return h 'div.plane-desc', [
        h 'p', {}, "Roll over a measurement to see details"
      ]
    attitude = attitude[0]

    isSelected = selection.find (d)->d.uid == attitude.uid

    {strike,dip,uid,members} = attitude

    if isSelected
      __ = 'remove from selection'
    else
      __ = 'select this measurement'

    selectionInfo = h 'p.info', [
      "Type ", h("code","s"), " to "+__
    ]
    if selection.length > 0
      selectionInfoA = h 'p.info', [
        "Type ", h("code","backspace"), " to clear selection"
      ]

    members ?= []
    if members.length > 0
      memberInfo = h 'p', "Group of #{members.length} measurements"

    return h 'div.plane-desc', [
      h 'h3.data-id', [
        "ID: "
        h 'span.data.id', uid
      ]
      memberInfo
      h 'h4', 'Nominal Plane'
      h 'ul', [
        h AngularMeasurement, {label: 'Strike: ', datum: strike}
        h AngularMeasurement, {label: 'Dip:    ', datum: dip}
      ]
      h 'h4', 'Angular errors'
      @angularErrors()
      selectionInfo
      selectionInfoA or null
    ]

  angularErrors: ->
    {min_angular_error, max_angular_error} = @props.attitude
    if (min_angular_error == 0 and max_angular_error == 0)
      return h 'p', 'No errors recorded'
    return h 'ul', [
      h AngularMeasurement, {label: 'Min: ', datum: min_angular_error}
      h AngularMeasurement, {label: 'Max: ', datum: max_angular_error}
    ]


export {DataPanelComponent}
