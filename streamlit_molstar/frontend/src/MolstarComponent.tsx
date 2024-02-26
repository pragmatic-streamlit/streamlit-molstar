import {
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"
import { FullScreen, useFullScreenHandle } from "react-full-screen"
// @ts-ignore
//import Molstar from "molstar-react";
import Molstar from "./Molstar.jsx"
import "./MolstarComponent.css"

interface State {}

const MyFullScreen = (props: any) => {
  const handler = useFullScreenHandle()
  return (
    <>
      <button className="fullscreen-button" onClick={handler.enter}>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </button>
      <FullScreen className="myfullscreen" handle={handler}>
        {props.children}
      </FullScreen>
    </>
  )
}

class MolstarComponent extends StreamlitComponentBase<State> {
  public render = (): ReactNode => {
    const height = this.props.args["height"]
    const modelFile = this.props.args["modelFile"]
    const trajFile = this.props.args["trajFile"]
    const modelFiles = this.props.args["modelFiles"]

    if (modelFile && modelFile.data) {
      modelFile.data = this.props.args["modelFile_data"]
    }
    if (trajFile && trajFile.data) {
      trajFile.data = this.props.args["trajFile_data"];
    }
    if (modelFiles) {
      for (let i = 0; i < modelFiles.length; i++) {
        modelFiles[i].data = this.props.args["modelFiles_data"][i]
      }
    }

    return (
      <div style={{ height: height }}>
        <MyFullScreen>
          <Molstar
            modelFile={modelFile}
            modelFiles={modelFiles}
            trajFile={trajFile}
            showExpand={false}
            showAnimation={true}
          />
        </MyFullScreen>
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
