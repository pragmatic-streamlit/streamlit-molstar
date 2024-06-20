/** 
    This file is under the Apache License 2.0.
    The original license can be found in the `streamlit_molstar/pocket/frontend/src/LICENSE` file.
    Copyright 2017-2024 Charles University Structural Bioinformatics Group
    Any modifications to this file should be explicitly stated below.
*/

import React from "react";

export default class PocketProperty extends React.Component
    <{
        title: string,
        data: string | number,
        inDialog: boolean // not needed now. but in other cases the implementation could be potentially different.
    }, {}> {

    constructor(props: any) {
        super(props);
    }

    render() {
        return (
            <div style={{margin: "0.5rem"}}>
                <strong>{this.props.title}:</strong> <span style={{float: "right", marginLeft: "1rem"}}>{this.props.data}</span>
            </div>
        );
    }
}