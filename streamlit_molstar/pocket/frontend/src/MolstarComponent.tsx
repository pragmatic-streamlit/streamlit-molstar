import {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"
import { FullScreen, useFullScreenHandle } from "react-full-screen"
import "./bootstrap.scss";
import { renderProteinView } from "./application";

interface State {}


class MolstarComponent extends StreamlitComponentBase<State> {
  componentDidUpdate(): void {
    setTimeout(() => {
      Streamlit.setFrameHeight();
    }, 1000);
  }

  componentDidMount(): void {
    const proteinFile = this.props.args["proteinFile"]
    const pocketsFile = this.props.args["pocketsFile"]

    if (proteinFile.data) {
      proteinFile.data = this.props.args["proteinFile_data"]
    }
    if (pocketsFile.data) {
      pocketsFile.data = this.props.args["pocketsFile_data"]
    }
    renderProteinView(proteinFile, pocketsFile);
    setTimeout(() => {
      Streamlit.setFrameHeight();
    }, 3000);
  }
  public render = (): ReactNode => {
    const height = 0;
    return (
      <div style={{ height: height }}>
      </div>
    )
  }
}




// "withStreamlitConnection" is a wrapper function. It bootstraps the
// connection between your component and the Streamlit app, and handles
// passing arguments from Python -> Component.
//
// You don't need to edit withStreamlitConnection (but you're welcome to!).
export default withStreamlitConnection(MolstarComponent)
