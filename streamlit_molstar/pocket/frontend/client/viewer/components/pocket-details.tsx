import React from "react";
import { PocketData } from "../../custom-types";
import PocketProperty from "./pocket-property";
import PocketClientTask from "./pocket-client-task";

export default class PocketDetails extends React.Component
    <{
        pocket: PocketData,
        inDialog: boolean,
    }, {}> {

    constructor(props: any) {
        super(props);
        this.checkValidValue = this.checkValidValue.bind(this);
    }

    checkValidValue(data: number | undefined) {
        //here double equal sign is used intentionally
        if(data == undefined || data == 0) return false;
        return true;
    }

    render() {
        const pocket = this.props.pocket;
        return (
            <div className={this.props.inDialog ? "" : "card-body"}>
                <PocketProperty inDialog={this.props.inDialog} title="Pocket rank" data={pocket.rank}/>
                <PocketProperty inDialog={this.props.inDialog} title="Pocket score" data={pocket.score}/>
                <PocketProperty inDialog={this.props.inDialog} title="Probability score" data={pocket.probability || "N/A"}/>
                <PocketProperty inDialog={this.props.inDialog} title="AA count" data={pocket.residues.length}/>
                {this.checkValidValue(pocket.avgConservation) && <PocketProperty inDialog={this.props.inDialog} title="Conservation" data={pocket.avgConservation!}/>}
                {this.checkValidValue(pocket.avgAlphaFold) && <PocketProperty inDialog={this.props.inDialog} title="AlphaFold avg" data={pocket.avgAlphaFold!}/>}
                {this.props.inDialog && <PocketProperty inDialog={this.props.inDialog} title="Residues" data={pocket.residues.join(", ")}/>}
            </div>
        );
    }
}