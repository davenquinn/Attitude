import h from "react-hyperscript";
import React from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import classNames from "classnames";
import { Button, Switch } from "@blueprintjs/core";

class SelectionListComponent extends React.Component {
  constructor(...args) {
    super(...args);
    this.render = this.render.bind(this);
    this.createListItem = this.createListItem.bind(this);
    this.onClick = this.onClick.bind(this);
    this.selectionText = this.selectionText.bind(this);
  }

  static initClass() {
    this.defaultProps = {
      attitudes: [],
      selection: [],
      onHover() {},
      showGroups: true,
      zoomedToSelection: false,
      zoomToSelection() {},
    };
  }
  render() {
    let onClick;
    const { attitudes, selection, onClearSelection } = this.props;
    const disabled = selection.length === 0;

    let clearSelectionButton = null;
    if (onClearSelection != null) {
      onClick = onClearSelection;
      clearSelectionButton = h(
        Button,
        {
          disabled,
          onClick,
        },
        "Clear selection"
      );
    }
    return h("div.selection-list", [
      h("ul", attitudes.map(this.createListItem)),
      h(Switch, {
        label: "Show groups",
        checked: this.props.showGroups,
        onChange: this.props.onToggleShowGroups,
      }),
      h(
        Button,
        {
          disabled: disabled && this.props.attitudes.length !== 0,
          onClick: this.props.zoomToSelection,
        },
        this.props.zoomedToSelection ? "Show all data" : "Show only selection"
      ),
      h(CopyToClipboard, { text: this.selectionText() }, [
        h(Button, { disabled }, "Copy to clipboard"),
      ]),
      clearSelectionButton,
    ]);
  }

  createListItem(d) {
    const { selection, hovered, showGroups } = this.props;
    if (d.members != null && !showGroups) {
      return null;
    }
    const selected = selection.find((sel) => sel.uid === d.uid);
    let isHovered = false;
    const inGroup = d.member_of != null;
    if (hovered != null) {
      isHovered = hovered.find((hov) => hov.uid === d.uid);
    }

    const className = classNames({ selected, hovered: isHovered });

    const style = (function () {
      if (!isHovered) {
        return {};
      }
      const c = d.color || "gray";
      if (inGroup) {
        return {
          stroke: c,
          color: c,
        };
      }
      return {
        backgroundColor: c,
        color: "white",
      };
    })();
    const onClick = this.onClick(d);
    const key = d.uid;
    const onMouseOver = () => this.props.onHover(d);
    return h("li", { className, onClick, key, onMouseOver, style }, d.uid);
  }

  onClick(d) {
    return () => {
      if (!this.props.onClick) {
        return;
      }
      return this.props.onClick(d);
    };
  }

  selectionText(d) {
    const cid = this.props.selection.map((v) => `\"${v.uid}\"`);
    return `[${cid.join(",")}]`;
  }
}
SelectionListComponent.initClass();

export { SelectionListComponent };
