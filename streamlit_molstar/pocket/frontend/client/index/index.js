import "../bootstrap.scss";
import "../background.css";
import "./index.css";

class View {

  static PDB_VIEW = 0;

  static USER_VIEW = 1;

  static UNIPROT_VIEW = 2;

  constructor() {
    this.pdbInput = document.getElementById("input-pdb");
    this.userInput = document.getElementById("input-user-file");
    this.uniprotInput = document.getElementById("input-uniprot");
    //
    this.pdbSection = document.getElementById("input-pdb-block");
    this.pdbCode = document.getElementById("pdb-code");
    this.pdbSealStructure = document.getElementById("pdb-seal-structure");
    this.pdbChainsSection = document.getElementById("pdb-chains");
    this.pdbChainsContainer = document.getElementById("pdb-chains-container");
    this.pdbChainsLabel = document.getElementById("pdb-chains-label");
    this.pdbChainsStore = document.getElementById("pdb-chains-store");
    this.userSection = document.getElementById("input-user-file-block");
    this.userFile = document.getElementById("user-file");
    this.userChains = document.getElementById("user-file-chains");
    this.uniprotSection = document.getElementById("input-uniprot-block");
    this.uniprotCode = document.getElementById("uniprot-code");
    this.message = document.getElementById("message");
    this.conservation = document.getElementById("conservation");
    this.submit = document.getElementById("submit-button");
    //
    this.controller = null;
  }

  connect(controller) {
    this.controller = controller;
    //
    this.pdbInput.addEventListener(
      "change",
      () => controller.onInputChange(View.PDB_VIEW))
    this.userInput.addEventListener(
      "change",
      () => controller.onInputChange(View.USER_VIEW))
    this.uniprotInput.addEventListener(
      "change",
      () => controller.onInputChange(View.UNIPROT_VIEW))
    this.pdbSealStructure.addEventListener(
      "change",
      (event) => controller.onPdbSealedChange(event.target.checked));
    this.pdbCode.addEventListener(
      "input",
      (event) => {
        const value = this.sanitizeCode(event.target.value);
        this.pdbCode.value = value;
        controller.onPdbCodeChange(value);
      });
    this.userFile.addEventListener(
      "input",
      (event) => controller.onUserFileChange(event.target.value));
    this.userChains.addEventListener(
      "input",
      (event) => {
        // No action here, just make sure about the format.
        this.userChains.value = this.sanitizeChains(event.target.value);
      });
    this.uniprotCode.addEventListener(
      "input",
      (event) => {
        const value = this.sanitizeCode(event.target.value);
        this.uniprotCode.value = value;
        controller.onUniprotCodeChange(value);
      });
    this.submit.addEventListener(
      "click",
      (event) => controller.onSubmit(event));
    // Load chain list.
    if (this.getInputSection() === View.PDB_VIEW && !this.getPdbSealed()) {
      controller.initializePdbChainsAfterLoad();
    }
    // Notify controller about the active tab.
    controller.onInputChange(this.getInputSection());
  }

  sanitizeCode(value) {
    return value.replace(/[^0-9a-z]/gi, "").toUpperCase();
  }

  sanitizeChains(value) {
    return value.replace(/[^0-9a-z,]/gi, "").toUpperCase();
  }

  getInputSection() {
    console.log("getInputSection",
      this.pdbInput.checked,
      this.userInput.checked,
      this.uniprotInput.checked);
    if (this.uniprotInput.checked) {
      return View.UNIPROT_VIEW;
    }
    if (this.userInput.checked) {
      return View.USER_VIEW;
    }
    if (this.pdbInput.checked) {
      return View.PDB_VIEW;
    }
    // Else select the first one.
    this.pdbInput.checked = true;
    return View.PDB_VIEW;
  }

  showPdbInputSection() {
    this.pdbSection.style.display = "";
    this.userSection.style.display = "none";
    this.uniprotSection.style.display = "none";
  }

  showUserInputSection() {
    this.pdbSection.style.display = "none";
    this.userSection.style.display = "";
    this.uniprotSection.style.display = "none";
  }

  showUniprotInputSection() {
    this.pdbSection.style.display = "none";
    this.userSection.style.display = "none";
    this.uniprotSection.style.display = "";
  }

  showPdbChains() {
    this.pdbChainsSection.style.display = "";
  }

  hidePdbChains() {
    this.pdbChainsSection.style.display = "none";
  }

  getPdbCode() {
    return this.pdbCode.value;
  }

  getPdbSealed() {
    return this.pdbSealStructure.checked;
  }

  getUserFile() {
    return this.userFile.value;
  }

  getUserFileObject() {
    return this.userFile.files[0];
  }

  getUserChains() {
    return this.userChains.value;
  }

  getUniprotCode() {
    return this.uniprotCode.value;
  }

  disableSubmit() {
    this.submit.disabled = true;
  }

  enableSubmit() {
    this.submit.disabled = false;
  }

  invalidatePdbChain() {
    this.pdbChainsLabel.innerText = "Please insert valid PDB code first.";
    this.pdbChainsContainer.innerHTML = "";
  }

  beginPdbChainLoading() {
    this.pdbChainsLabel.innerText = "Loading chains from PDB ...";
    this.pdbChainsContainer.innerHTML = "";
  }

  endPdbChainLoading(chains, asChecked) {
    this.pdbChainsLabel.innerText = "Chains:";
    this.pdbChainsContainer.innerHTML = "";
    chains.forEach(chain => this.pdbChainsContainer.appendChild(
      this.createCheckBoxForChain(chain, asChecked)));
  }

  selectPdbChains(chains) {
    const form = document.forms["input-form"];
    for (const element of form) {
      if (element.name !== "pdb-chain-value") {
        continue;
      }
      element.checked = chains.includes(element.value);
    }
  }

  createCheckBoxForChain(chain, asChecked) {
    const input = document.createElement("input");
    input.className = "form-check-input";
    input.setAttribute("type", "checkbox");
    if (asChecked) {
      input.setAttribute("checked", "checked");
    }
    input.setAttribute("name", "pdb-chain-value");
    input.setAttribute("value", chain);
    input.addEventListener("change", () => this.controller.onPdbChainChange());
    const label = document.createElement("label");
    label.appendChild(input);
    label.appendChild(document.createTextNode(
      `\u00A0${chain}\u00A0\u00A0`))
    label.className = "form-check-label";
    return label;
  }

  getPdbChains() {
    const form = document.forms["input-form"];
    let count = 0;
    const selected = [];
    for (const element of form) {
      if (element.name !== "pdb-chain-value") {
        continue;
      }
      ++count;
      if (!element.checked) {
        continue;
      }
      selected.push(element.value);
    }
    return {
      "selected": selected,
      "count": count
    };
  }

  setMessage(content) {
    if (content) {
      this.message.innerText = content;
      this.message.style.display = "";
    } else {
      this.message.style.display = "none";
    }
  }

  setChainStore(chains) {
    console.trace("setChainStore", chains);
    if (chains) {
      this.pdbChainsStore.value = chains.join(",");
    } else {
      this.pdbChainsStore.value = '';
    }
  }

  getChainStore() {
    const value = this.pdbChainsStore.value;
    if (value) {
      return this.pdbChainsStore.value.split(",");
    } else {
      return [];
    }
  }

  getConservation() {
    return this.conservation.checked;
  }

}

class Controller {

  constructor() {
    this.view = new View();
    this.chainsFetchedForCode = "";
  }

  initialize() {
    this.view.connect(this);
  }

  onInputChange(index) {
    switch (index) {
      case View.PDB_VIEW:
        this.view.showPdbInputSection();
        if (this.view.getPdbSealed()) {
          this.view.hidePdbChains();
        } else {
          this.view.showPdbChains();
        }
        this.onPdbCodeChange(this.view.getPdbCode());
        break;
      case View.USER_VIEW:
        this.view.showUserInputSection();
        this.onUserFileChange(this.view.getUserFile());
        break;
      case View.UNIPROT_VIEW:
        this.view.showUniprotInputSection();
        this.onUniprotCodeChange(this.view.getUniprotCode());
        break;
      default:
        console.error("Invalid selected tab.");
    }
  }

  onPdbSealedChange(visible) {
    if (visible) {
      this.view.hidePdbChains();
      this.view.setMessage();
    } else {
      this.view.showPdbChains();
      // We use this to trigger rendering of chains if needed.
      this.onPdbCodeChange(this.view.getPdbCode());
    }
  }

  onPdbCodeChange(next) {
    const isCodeValid = this.validatePdbCode(next);
    this.setSubmitEnabled(isCodeValid && this.validatePdbChains());
    // const pdbChains = this.view.getPdbChains().selected;
    if (!isCodeValid) {
      this.view.invalidatePdbChain();
    } else if (!this.view.getPdbSealed()) {
      this.fetchChainsForPdbCode(next, true);
    }
  }

  validatePdbCode(code) {
    return code.length === 4 && /^[a-zA-Z0-9]*$/.test(code);
  }

  validatePdbChains() {
    if (this.view.getPdbSealed()) {
      return true;
    }
    const chains = this.view.getPdbChains();
    if (chains.selected.length > 0) {
      this.view.setMessage();
      return true;
    } else {
      if (chains.count > 0) {
        this.view.setMessage("At least one chain must be selected.")
      }
      return false;
    }
  }

  async fetchChainsForPdbCode(code, selectAllByDefault) {
    if (this.chainsFetchedForCode === code) {
      return;
    }
    this.chainsFetchedForCode = code;
    this.view.beginPdbChainLoading();
    const url = "https://www.ebi.ac.uk/pdbe/api/pdb/entry/molecules/" + code;
    const response = await fetch(url);
    if (response.status !== 200) {
      return;
    }
    let chains = [];
    (await response.json())[code.toLowerCase()]
      .filter(entity => entity["sequence"])
      .forEach(entity => entity["in_chains"].forEach(
        (chain) => chains.includes(chain) ? null : chains.push(chain)
      ));
    const afterCode = this.view.getPdbCode();
    if (afterCode === code) {
      this.view.endPdbChainLoading(chains, selectAllByDefault);
      if (selectAllByDefault) {
        this.view.setChainStore(chains);
      }
      // This may also render submit button valid.
      this.setSubmitEnabled(
        this.validatePdbCode(code) && this.validatePdbChains());
    }
  }

  setSubmitEnabled(enabled) {
    if (enabled) {
      this.view.enableSubmit();
    } else {
      this.view.disableSubmit();
    }
  }

  onPdbChainChange() {
    this.view.setChainStore(this.view.getPdbChains().selected);
    this.setSubmitEnabled(this.validatePdbChains());
  }

  onUserFileChange(next) {
    this.setSubmitEnabled(next);
  }

  onUniprotCodeChange(next) {
    this.setSubmitEnabled(next);
  }

  async initializePdbChainsAfterLoad() {
    const code = this.view.getPdbCode();
    this.view.showPdbChains();
    if (!this.validatePdbCode(code)) {
      return;
    }
    await this.fetchChainsForPdbCode(code, false)
    if (code !== this.view.getPdbCode()) {
      // User changed the code in a meanwhile.
      return;
    }
    this.view.selectPdbChains(this.view.getChainStore());
  }

  onSubmit(event) {
    event.preventDefault();
    const submit = new Submit();
    switch (this.view.getInputSection()) {
      case View.PDB_VIEW:
        return submit.submitPdbCode(this.view);
      case View.USER_VIEW:
        return submit.submitUserFile(this.view);
      case View.UNIPROT_VIEW:
        return submit.submitUniprotCode(this.view);
    }
  }

}

class Submit {

  submitPdbCode(view) {
    const code = view.getPdbCode();
    const sealed = view.getPdbSealed();
    const chains = view.getPdbChains();
    const conservation = view.getConservation();
    let url;
    if (conservation) {
      url = this.createUrl(
        "v3-conservation-hmm",
        code, sealed ? [] : chains);
    } else {
      url = this.createUrl(
        "v3",
        code, sealed ? [] : chains);
    }
    window.location.href = url;
  }

  createUrl(database, code, chains) {
    let result = "./analyze?database=" + database + "&code=" + code;
    if (chains.length > 0) {
      result += "_" + chains.join(",");
    }
    return result;
  }

  submitUserFile(view) {
    const structure = view.getUserFileObject();
    const chains = view.getUserChains();
    const conservation = view.getConservation();
    //
    const formData = new FormData();
    formData.append(
      "structure", structure, structure.name);
    formData.append(
      "configuration",
      this.asJsonBlob({
        "chains": chains,
        "structure-sealed": chains.length === 0,
        "compute-conservation": conservation,
      }),
      "configuration.json");
    this.sendPostRequest("./api/v2/prediction/v3-user-upload", formData);
  }

  asJsonBlob(content) {
    return new Blob([JSON.stringify(content)], {"type": "text/json"});
  }

  sendPostRequest(url, data) {
    fetch(url, {
      "method": "post",
      "body": data,
    }).then(async (response) => {
      if (response.status !== 201) {
        alert(`Can't create new task (status code: ${response.status})`);
        return;
      }
      const content = await response.json();
      window.location.href = this.createUrl("v3-user-upload", content.id, []);
    });
  }

  submitUniprotCode(view) {
    const code = view.getUniprotCode();
    const conservation = view.getConservation();
    let url;
    if (conservation) {
      url = this.createUrl("v3-alphafold-conservation-hmm", code, [])
    } else {
      url = this.createUrl("v3-alphafold", code, [])
    }
    window.location.href = url;
  }

}

(function initialize() {
  const controller = new Controller();
  window.addEventListener("load", () => {
    controller.initialize();
  });
})();
