import {
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"
import { FullScreen, useFullScreenHandle } from "react-full-screen"

// @ts-ignore
import Molstar from "./Molstar.jsx"
// @ts-ignore
import "./MolstarComponent.css"

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

interface State {}

class MolstarComponent extends StreamlitComponentBase<State> {

  public render = (): ReactNode => {
    const height = this.props.args["height"]

    return (
      <div style={{ height: height}}>
        <MyFullScreen>
          <Molstar           />
        </MyFullScreen>
      </div>
    )
  }
}

export default withStreamlitConnection(MolstarComponent)
