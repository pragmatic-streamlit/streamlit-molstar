import { renderProteinView } from "./application";

import "../bootstrap.scss";
import { fetchPrediction } from "../prankweb-api";

function handleError() {
    document.getElementById('message')!.style.display = 'block';
    document.getElementById('message-text')!.innerHTML = "<br/>Incomplete or incorrect task specification.<br/>Please go back to the <a href='/'>home page</a>.";
    document.getElementById('analyze')!.style.display = 'none';
}

async function initialize() {
    const params = new URLSearchParams(window.location.search);

    let id = params.get("id");
    let database = params.get("database");

    if(id === null || database === null) {
        handleError();
        return;
    }

    let predictionInfo = await fetchPrediction(database, id);

    if(predictionInfo.content === null) {
        console.log('xxxxxxxx');
        handleError();
        return;
    }

    //document.getElementById('footer')!.style.display = 'none';
    renderProteinView(predictionInfo.content);
};

initialize();