import { fetchPrediction, fetchPredictionLog, PredictionInfo, TaskStatus } from "../prankweb-api";

import "./analyze.css";
import "../bootstrap.scss";

enum UserInterface {
  progress = "progress",
  progressRunning = "progress-running",
  progressMessage = "progress-message",
  progressQuestions = "progress-questions",
  progressStdout = "progress-stdout",
}

/**
 * We check more frequently at the start and slowly increase the
 * check period over time to maximum.
 */
let queuedTimeout = 500;

async function checkTaskStatus() {
  const params = getUrlQueryParams();
  if (params.database === null || params.id === null) {
    renderInvalidTask();
    return;
  }
  let response;
  try {
    response = await fetchPrediction(params.database, params.id);
  } catch (ex) {
    renderInvalidHttpResponse();
    setTimeout(checkTaskStatus, 7000);
    return;
  }
  if (response.statusCode == 404) {
    renderNotFound();
    return;
  }
  if (response.statusCode < 200 || response.statusCode > 299
    || response.content == null) {
    renderUnexpectedResponse(response.statusCode);
    return;
  }
  switch (response.content.status) {
    case TaskStatus.queued:
      renderQueued()
      queuedTimeout = Math.min(queuedTimeout + 1000, 10000);
      setTimeout(checkTaskStatus, queuedTimeout);
      return;
    case TaskStatus.successful:
      renderTaskFinished(response.content);
      return;
    case TaskStatus.failed:
      renderFailedTask(params.database, params.id);
      return;
    default:
      renderRunningTask(params.database, params.id);
      setTimeout(checkTaskStatus, 3000);
      return
  }
}

function getUrlQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    "database": params.get("database"),
    "id": params.get("code"),
  }
}

function renderInvalidTask() {
  showOnlyElements([
    UserInterface.progress,
    UserInterface.progressMessage,
    UserInterface.progressQuestions
  ]);
  setProgressMessage("<br/>Incomplete or incorrect task specification.<br/>Please go back to the <a href='/'>home page</a>.");
}

function showOnlyElements(identifiersToShow: UserInterface[]) {
  for (const item of Object.values(UserInterface)) {
    const element = document.getElementById(item)!;
    if (identifiersToShow.includes(item)) {
      element.classList.remove("display-none");
    } else {
      element.classList.add("display-none");
    }
  }
}

function setProgressMessage(text: string) {
  const failedText = document.getElementById('progress-message-text')!;
  failedText.innerHTML = text;
}

function renderInvalidHttpResponse() {
  showOnlyElements([
    UserInterface.progress,
    UserInterface.progressMessage,
  ]);
  setProgressMessage(
    "<br/>Failed to contact the server.<br/>\n" +
    "We will retry in a few seconds."
  );
}

function renderNotFound() {
  showOnlyElements([
    UserInterface.progress,
    UserInterface.progressMessage,
    UserInterface.progressQuestions
  ]);
  setProgressMessage("<br/>Given prediction was not found.");
}

function renderUnexpectedResponse(statusCode: number) {
  showOnlyElements([
    UserInterface.progress,
    UserInterface.progressMessage,
    UserInterface.progressQuestions
  ]);
  setProgressMessage(`<br/>Server send ${statusCode} code.`);
}

function renderQueued() {
  showOnlyElements([
    UserInterface.progress,
    UserInterface.progressMessage,
    UserInterface.progressRunning
  ]);
  setProgressMessage("Waiting in queue...");
}

function renderTaskFinished(data: PredictionInfo) {
  //this method redirects to the viewer page with all the needed information
  const result = `./viewer?id=${data.id}&database=${data.database}`;
  window.location.href = result;
}

function renderFailedTask(database: string, id: string) {
  showOnlyElements([
    UserInterface.progress,
    UserInterface.progressMessage,
    UserInterface.progressQuestions,
    UserInterface.progressStdout
  ]);
  setProgressMessage("Task failed, see the log below for more details.");
  setStdout(database, id);
}

function renderRunningTask(database: string, id: string) {
  showOnlyElements([
    UserInterface.progress,
    UserInterface.progressMessage,
    UserInterface.progressRunning,
    UserInterface.progressStdout
  ]);
  setProgressMessage(
    "Please wait, running analysis...<br/> " +
    "Some operations may take a longer time to compute.<br/>" +
    "You can monitor progress in the log below."
  );
  setStdout(database, id);
}

function setStdout(database: string, id: string) {
  fetchPredictionLog(database, id).then(response => {
    document.getElementById("progress-stdout-text")!.innerText = response;
  });
}

function initialize() {
  checkTaskStatus();
};

initialize();