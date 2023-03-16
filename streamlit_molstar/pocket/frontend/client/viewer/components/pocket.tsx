import React from "react";
import { PocketData } from "../../custom-types";
import DraggableDialog from './draggable-dialog'
import PocketDetails from "./pocket-details";

import "bootstrap-icons/font/bootstrap-icons.css";

export default class Pocket extends React.Component
  <{
    pocket: PocketData,
    index: number,
    setPocketVisibility: (index: number, isVisible: boolean) => void,
    showOnlyPocket: (index: number) => void,
    focusPocket: (index: number) => void,
    highlightPocket: (index: number, isHighlighted: boolean) => void
  }, {
    visible: boolean,
    details: boolean,
    pocketTextColor: string
  }> {

  state = {
    "visible": true,
    "details": false,
    "pocketTextColor": "black"
  };

  constructor(props: any) {
    super(props);
    this.onPocketMouseEnter = this.onPocketMouseEnter.bind(this);
    this.onPocketMouseLeave = this.onPocketMouseLeave.bind(this);
    this.onPocketClick = this.onPocketClick.bind(this);
    this.showOnlyClick = this.showOnlyClick.bind(this);
    this.togglePocketVisibility = this.togglePocketVisibility.bind(this);
    this.toggleCardVisibility = this.toggleCardVisibility.bind(this);
    this.showPocketDetails = this.showPocketDetails.bind(this);
    this.computePocketTextColor = this.computePocketTextColor.bind(this);
  }

  onPocketMouseEnter() {
    if (!this.props.pocket.isVisible) {
      return;
    }
    this.props.highlightPocket(this.props.index, true);
  }

  onPocketMouseLeave() {
    if (!this.props.pocket.isVisible) {
      return;
    }
    this.props.highlightPocket(this.props.index, false);
  }

  onPocketClick() {
    // Cannot focus on hidden pocket.
    if (!this.props.pocket.isVisible) {
      return;
    }
    this.props.focusPocket(this.props.index);
  }

  showOnlyClick() {
    this.props.showOnlyPocket(this.props.index);
  }

  togglePocketVisibility() {
    this.props.setPocketVisibility(this.props.index, !this.props.pocket.isVisible);
    this.setState({ "pocketTextColor": this.computePocketTextColor() });
  }

  toggleCardVisibility() {
    this.setState({ "visible": !this.state.visible });
  }

  showPocketDetails() {
    this.setState({ "details": true });
  }

  computePocketTextColor() {
    if (!this.props.pocket.isVisible) {
      return "white";
    }
    
    //code from https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color
    //How to decide font color in white or black depending on background color?
    //cc SudoPlz
    const bgColor = this.props.pocket.color!;
    const color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
    const r = parseInt(color.substring(0, 2), 16); // hexToR
    const g = parseInt(color.substring(2, 4), 16); // hexToG
    const b = parseInt(color.substring(4, 6), 16); // hexToB
    return (((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186) ? "black" : "white";
  }

  componentDidMount() {
    this.setState({ "pocketTextColor": this.computePocketTextColor() });
  }

  calculatePocketColorWithAlpha(alpha: number, bgColor: string) {
    const color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
    const r = parseInt(color.substring(0, 2), 16); // hexToR
    const g = parseInt(color.substring(2, 4), 16); // hexToG
    const b = parseInt(color.substring(4, 6), 16); // hexToB
    return `rgba(${r},${g},${b},${alpha})`;
  }

  render() {
    const pocket = this.props.pocket;
    let pocketColor = this.calculatePocketColorWithAlpha(0.75, this.props.pocket.color!);

    if (pocket.isVisible === undefined) { //for pockets that load for the first time
      pocket.isVisible = true;
    }
    if (!this.props.pocket.isVisible) {
      pocketColor = "gray";
    }
    return (
      <div>
        <div className="card pocket" style={{ "borderColor": pocketColor }}>
          <div className="card-header text-center" style={{ "backgroundColor": pocketColor, "marginTop": "0.05em"}}>
            <div className="row" style={{"marginTop": "0.25em", "marginBottom": "0.5em"}}>
              <div className="col-9">
                <h4 className="card-title" style={{"marginBottom": 0, "color": this.state.pocketTextColor}}>Pocket {pocket.rank}</h4>
              </div>
              <div className="col-3">
                <button
                  type="button"
                  title="HIDE/SHOW"
                  className="btn btn-outline-secondary btnIcon"
                  onClick={this.toggleCardVisibility}
                  style={{"color": this.state.pocketTextColor}}
                >
                  {this.state.visible ? 
                  <i className="bi bi-caret-up" style={{"width": "1em"}}></i>
                  :
                  <i className="bi bi-caret-down" style={{"width": "1em"}}></i>
                  }
                </button>
              </div>
            </div>
          </div>
          {this.state.visible && <PocketDetails pocket={pocket} inDialog={false}/>}
          {this.state.visible && <div className="card-footer" style={{"padding": "0.5rem",}}>
            <div className="container" style={{"padding": 0}}>
              <div className="row">
                <div className="col-3">
                  <DraggableDialog pocket={this.props.pocket} />
                </div>
                <div className="col-3">
                  <button
                    type="button"
                    title="Show only this pocket"
                    className="btn btn-outline-secondary btnIcon"
                    onClick={this.showOnlyClick}
                  >
                    <i className="bi bi-eye" style={{"width": "1em"}}></i>
                  </button>
                </div>
                <div className="col-3">
                  <button
                      type="button"
                      style={{
                        "display": this.props.pocket.isVisible ? "inherit" : "none",
                      }}
                      title="Focus/highlight to this pocket."
                      className="btn btn-outline-secondary btnIcon"
                      onClick={this.onPocketClick}
                      onMouseEnter={this.onPocketMouseEnter}
                      onMouseLeave={this.onPocketMouseLeave}
                    >
                    <i className="bi bi-search" style={{"width": "1em"}}></i>
                  </button>
                </div>
                <div className="col-3">
                  <button
                    type="button"
                    title="Show / Hide pocket."
                    className="btn btn-outline-secondary btnIcon"
                    onClick={this.togglePocketVisibility}>
                    {this.props.pocket.isVisible ?
                      <i className="bi bi-x-circle" style={{"width": "1em"}}></i>
                      : 
                      <i className="bi bi-check-circle" style={{"width": "1em"}}></i>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>}
        </div>
      </div>
    )
  }
}