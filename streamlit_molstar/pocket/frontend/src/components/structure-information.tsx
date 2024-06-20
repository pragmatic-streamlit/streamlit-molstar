/** 
    This file is under the Apache License 2.0.
    The original license can be found in the `streamlit_molstar/pocket/frontend/src/LICENSE` file.
    Copyright 2017-2024 Charles University Structural Bioinformatics Group
    Any modifications to this file should be explicitly stated below.
*/

import React from "react";

type Metadata = {
  structureName: string;
  predictionName: string;
  predictedStructure?: boolean;
};

export function StructureInformation(
  props: { metadata: Metadata, database: string }
) {
  return (
    <div className="card control-box my-2">
      <div className="card-header">
        <h3>Source</h3>
      </div>
      <StructureInformationBody {...props}/>
    </div>
  )
}

function StructureInformationBody(
  props: { metadata: Metadata, database: string }
) {
  const code = props.metadata.predictionName;
  const isUserProvided = props.database.includes("user-upload");
  if (isUserProvided) {
    return (
      <div className="card-body">
        User provided structure <br/> {code}.
      </div>
    )
  }
  const isPredicted = props.metadata["predictedStructure"] === true;
  if (isPredicted) {
    const url = `https://alphafold.ebi.ac.uk/entry/${code}`
    return (
      <div className="card-body predicted" role="alert">
        <strong>Warning:</strong> <br/>
        Predicted structure&nbsp;
        <a href={url} target="_blank" rel="nofollow noopener noreferrer">
          {code}
        </a>.
      </div>
    )
  }
  const url = `https://www.rcsb.org/structure/${code}`;
  return (
    <div className="card-body">
      Experimental structure&nbsp;
      <a href={url} target="_blank" rel="nofollow noopener noreferrer">
        {code}
      </a>.
    </div>
  )
}