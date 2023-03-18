import React from "react";
import { LoadingButton } from '@mui/lab';

export default class PocketClientTask extends React.Component
    <{
        title: string,
        inDialog: boolean // not needed now. but in other cases the implementation could be potentially different.
    }, {
        loading: boolean
    }> {

    constructor(props: any) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.state = {loading: false};
    }

    handleClick() {
        this.state.loading ? this.setState({loading: false}) : this.setState({loading: true});
    }

    render() {
        return (
            <div style={{margin: "0.5rem"}}>
                <strong>{this.props.title}:</strong> 
                <LoadingButton
                    size="small"
                    onClick={this.handleClick}
                    loading={this.state.loading}
                    variant="outlined"
                    style={{float: "right", marginLeft: "1rem"}}
                >
                    Fetch data
                </LoadingButton>
            </div>
        );
    }
}