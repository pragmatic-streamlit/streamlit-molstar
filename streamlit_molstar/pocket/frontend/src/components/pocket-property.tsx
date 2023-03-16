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