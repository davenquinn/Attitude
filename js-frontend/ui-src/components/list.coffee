import h from 'react-hyperscript'
import ReactDOM from 'react-dom'
import React from 'react'
import {CopyToClipboard} from 'react-copy-to-clipboard'
import classNames from 'classnames'
import { Button, Switch } from "@blueprintjs/core"

class SelectionListComponent extends React.Component
  @defaultProps: {
    attitudes: []
    selection: []
    onHover: ->
  }
  render: =>
    {attitudes, selection} = @props
    disabled = selection.length == 0
    h 'div.selection-list', [
      h 'ul', attitudes.map @createListItem
      h 'p', 'Select items on the list'
      h CopyToClipboard, {text: @selectionText()}, [
        h Button, {disabled}, "Copy to clipboard"
      ]
    ]

  createListItem: (d)=>
    {selection, hovered} = @props
    selected = selection.find (sel)->
      sel.uid == d.uid
    isHovered = false
    if hovered?
      isHovered = hovered.find (hov)->
        hov.uid == d.uid

    className = classNames {selected, hovered: isHovered}
    style = {}
    if isHovered
      style = {
        backgroundColor: d.color or 'gray',
        color: 'white'
      }
    onClick = @onClick(d)
    key = d.uid
    onMouseOver = => @props.onHover(d)
    h 'li', {className, onClick, key, onMouseOver, style}, d.uid

  onClick: (d)=> =>
    return unless @props.onClick
    @props.onClick(d)

  selectionText: (d)=>
    cid = @props.selection.map (v)-> "\"#{v.uid}\""
    return "[#{cid.join(',')}]"

export {SelectionListComponent}
