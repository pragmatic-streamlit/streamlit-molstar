import {
  Streamlit,
  StreamlitComponentBase,
  withStreamlitConnection,
} from "streamlit-component-lib"
import React, { ReactNode } from "react"
// import { FullScreen, useFullScreenHandle } from "react-full-screen"
// // @ts-ignore
// //import "./MolstarComponent.css"
import { renderProteinView } from "./application";
import { fetchPrediction } from "./prankweb-api";

interface State {}

function handleError() {
  document.getElementById('message')!.style.display = 'block';
  document.getElementById('message-text')!.innerHTML = "<br/>Incomplete or incorrect task specification.<br/>Please go back to the <a href='/'>home page</a>.";
  document.getElementById('analyze')!.style.display = 'none';
}

async function initialize() {
  const params = new URLSearchParams(window.location.search);

  let id = params.get("id")|| "";
  let database = params.get("database") || "";

  // if(id === null || database === null) {
  //     handleError();
  //     return;
  // }

  let predictionInfo = await fetchPrediction(database, id);

  if(predictionInfo.content === null) {
      console.log('xxxxxxxx');
      handleError();
      return;
  }
  //document.getElementById('footer')!.style.display = 'none';
  renderProteinView(predictionInfo.content);
};

class MolstarComponent extends StreamlitComponentBase<State> {
  componentDidUpdate(): void {
    Streamlit.setFrameHeight(1000);
  }
  componentDidMount(): void {
    initialize();
    Streamlit.setFrameHeight(1000);
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
