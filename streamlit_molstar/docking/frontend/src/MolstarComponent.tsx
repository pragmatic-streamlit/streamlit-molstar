import {
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib";
import React, { ReactNode } from "react";
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
// @ts-ignore
//import Molstar from "molstar-react";
import Molstar from "./Molstar.jsx";
import './MolstarComponent.css';

interface State {}

const MyFullScreen = (props: any) => {
  const handler = useFullScreenHandle();
  return (
    <>
      <button className='fullscreen-button' onClick={handler.enter}>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </button>
      <FullScreen className='myfullscreen' handle={handler}>
        {props.children}
        <div id="main"></div>
      </FullScreen>
    </>
  );
};


class MolstarComponent extends StreamlitComponentBase<State> {

  public render = (): ReactNode => {
    const height = this.props.args["height"]
    const receptorFile = this.props.args["receptorFile"]
    const ligandFile = this.props.args["ligandFile"]
    const gtLigandFile = this.props.args["gtLigandFile"]

    if (receptorFile && receptorFile.data) {
      receptorFile.data =  this.props.args["receptorFile_data"];
    }
    if (ligandFile && ligandFile.data) {
      ligandFile.data =  this.props.args["ligandFile_data"];
    }
    if (gtLigandFile && gtLigandFile.data) {
      gtLigandFile.data =  this.props.args["gtLigandFile_data"];
    }

    return (
      <div style={{ height: height }}>
        <MyFullScreen>
          <Molstar
            receptorFile={ receptorFile }
            ligandFile={ ligandFile }
            gtLigandFile={ gtLigandFile }
            showExpand={false}
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
