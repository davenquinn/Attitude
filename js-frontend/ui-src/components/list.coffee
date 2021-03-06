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
    showGroups: true
    zoomedToSelection: false
    zoomToSelection: ->
  }
  render: =>
    {attitudes, selection, onClearSelection} = @props
    disabled = selection.length == 0

    clearSelectionButton = null
    if onClearSelection?
      onClick = onClearSelection
      clearSelectionButton = h Button, {
        disabled, onClick
      }, "Clear selection"
    h 'div.selection-list', [
      h 'ul', attitudes.map @createListItem
      h Switch, {
        label: "Show groups"
        checked: @props.showGroups
        onChange: @props.onToggleShowGroups
      }
      h Button, {
        disabled: disabled and @props.attitudes.length != 0,
        onClick: @props.zoomToSelection
      }, if @props.zoomedToSelection then "Show all data" else "Show only selection"
      h CopyToClipboard, {text: @selectionText()}, [
        h Button, {disabled}, "Copy to clipboard"
      ]
      clearSelectionButton
    ]

  createListItem: (d)=>
    {selection, hovered, showGroups} = @props
    if d.members? and not showGroups
      return null
    selected = selection.find (sel)->
      sel.uid == d.uid
    isHovered = false
    inGroup = d.member_of?
    if hovered?
      isHovered = hovered.find (hov)->
        hov.uid == d.uid

    className = classNames {selected, hovered: isHovered}

    style = do ->
      return {} unless isHovered
      c = d.color or 'gray'
      if inGroup
        return {
          stroke: c
          color: c
        }
      return {
        backgroundColor: c
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
