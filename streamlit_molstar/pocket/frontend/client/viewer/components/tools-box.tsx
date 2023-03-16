import React from "react";

import "./tools-box.css";
import { PocketsViewType, PolymerViewType, PolymerColorType, PredictionData } from "../../custom-types";

export default class ToolsBox extends React.Component<{
  predictionData: PredictionData,
  downloadUrl: string,
  downloadAs: string,
  polymerView: PolymerViewType,
  pocketsView: PocketsViewType,
  polymerColor: PolymerColorType,
  onPolymerViewChange: (value: PolymerViewType) => void,
  onPocketsViewChange: (value: PocketsViewType) => void,
  onPolymerColorChange: (value: PolymerColorType) => void,
  isPredicted: boolean,
  isShowOnlyPredicted: boolean,
  onShowConfidentChange: () => void,
}, {
  /**
   * True for expanded component, false for minimized component.
   */
  visible: boolean
}> {

  state = {
    "visible": true,
    "showConfident": false,
  };

  constructor(props: any) {
    super(props);
    this.toggleVisible = this.toggleVisible.bind(this);
  }

  toggleVisible() {
    this.setState({"visible": !this.state.visible});
  }

  render() {
    return (
      <div className="card my-2">
        <div className="card-header">
          <h3 style={{"margin": "0"}}>
            Tools
            <button
              type="button"
              className="btn btn-default btn-icon-right"
              title="Show/Hide tools."
              onClick={this.toggleVisible}
            >
            {this.state.visible ? 
            <i className="bi bi-caret-up" style={{"width": "1em"}}></i>
            :
            <i className="bi bi-caret-down" style={{"width": "1em"}}></i>
            }
            </button>
          </h3>
        </div>
        {this.state.visible && <div className="card-body">
          <ControlBoxContent
            predictionData={this.props.predictionData}
            downloadUrl={this.props.downloadUrl}
            downloadAs={this.props.downloadAs}
            polymerView={this.props.polymerView}
            onPolymerViewChange={this.props.onPolymerViewChange}
            pocketsView={this.props.pocketsView}
            onPocketsViewChange={this.props.onPocketsViewChange}
            onPolymerColorChange={this.props.onPolymerColorChange}
            polymerColor={this.props.polymerColor}
            isPredicted={this.props.isPredicted}
            isShowOnlyPredicted={this.props.isShowOnlyPredicted}
            onShowConfidentChange={this.props.onShowConfidentChange}
          />
        </div>
        }
      </div>
    );
  }
}

class ControlBoxContent extends React.Component<{
    predictionData: PredictionData,
    downloadUrl: string,
    downloadAs: string,
    polymerView: PolymerViewType,
    onPolymerViewChange: (value: PolymerViewType) => void,
    pocketsView: PocketsViewType,
    polymerColor: PolymerColorType,
    onPocketsViewChange: (value: PocketsViewType) => void,
    onPolymerColorChange: (value: PolymerColorType) => void,
    isPredicted: boolean,
    isShowOnlyPredicted: boolean,
    onShowConfidentChange: () => void,
  }, {}> {

    constructor(props: any) {
      super(props);
      this.scoresDataAvailable = this.scoresDataAvailable.bind(this);
    }

    scoresDataAvailable(data: number[] | undefined) {
      if(data === undefined) return false;
      return !data.every((value) => value === 0); //if every value is 0, then we consider that data is not available
    }
  
    render() {
      return <div className="d-grid gap-2">
          <a
            className="btn btn-outline-secondary"
            href={this.props.downloadUrl}
            download={this.props.downloadAs}
          >
            Download data
          </a>
          <label>
            Protein visualisation
            <select
              id="polymer-visual"
              className="form-select"
              value={this.props.polymerView}
              onChange={(event) =>
                this.props.onPolymerViewChange(parseInt(event.target.value))}
            >
              <option value="0">Balls and Sticks</option>
              <option value="1">Surface</option>
              <option value="2">Cartoon</option>
            </select>
          </label>
          <label>
            Pockets visualisation (color by)
            <select
              id="pockets-visual"
              className="form-select"
              value={this.props.pocketsView}
              onChange={(event) =>
                this.props.onPocketsViewChange(parseInt(event.target.value))}
            >
              <option value="0">Balls and Sticks (atoms)</option>
              <option value="1">Balls and Sticks (residues)</option>
              <option value="2">Surface (atoms)</option>
              <option value="3">Surface (residues)</option>
            </select>
          </label>
          <label>
            Polymer coloring
            <select
              id="polymer-coloring"
              className="form-select"
              value={this.props.polymerColor}
              onChange={(event) =>
                this.props.onPolymerColorChange(parseInt(event.target.value))}
            >
              <option value="0">Clear</option>
              {this.scoresDataAvailable(this.props.predictionData.structure.scores.conservation) && <option value="1">Conservation</option>}
              {this.scoresDataAvailable(this.props.predictionData.structure.scores.plddt) && <option value="2">AlphaFold confidence</option>}
            </select>
          </label>
          {this.props.isPredicted && (
            <button
              type="button"
              className="btn btn-predicted"
              onClick={this.props.onShowConfidentChange}
            >
              {this.props.isShowOnlyPredicted ?
                "Show all regions" :
                "Show confident regions"}
            </button>
          )}
        </div>
    }
}