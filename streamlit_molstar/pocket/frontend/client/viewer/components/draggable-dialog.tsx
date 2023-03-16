import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper, { PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable';
import { PocketData } from "../../custom-types";
import PocketDetails from "./pocket-details";

function PaperComponent(props: PaperProps) {
  return (<Paper {...props} style={{ margin: 0, maxHeight: '100%' }} />
  );
}

export default class DraggableDialog extends React.Component<{
  pocket: PocketData
}, {
  visible: boolean
}> {

  state = {
    visible: false,
  };

  constructor(props: {pocket: PocketData}) {
    super(props);
    this.toggleDetailsVisibility = this.toggleDetailsVisibility.bind(this);
  }

  toggleDetailsVisibility(event: any, reason: any) {
    if (reason && reason == "backdropClick") return;
    this.setState({ "visible": !this.state.visible });
  }

  //https://stackoverflow.com/questions/61335587/how-can-material-uis-dialog-allow-interaction-behind-the-dialog/65925039#65925039

  render() {
    return (
      <div>
        <button
          type="button"
          title="Show details"
          className="btn btn-outline-secondary btnIcon"
          onClick={(e) => this.toggleDetailsVisibility(e, "btnClick")}
        >
          <i className="bi bi-info-circle" style={{"width": "1em"}}></i>
        </button>
        <Draggable
          handle={'[class*="MuiDialog-root"]'}
          cancel={'[class*="MuiDialogContent-root"]'}>
          <Dialog
            open={this.state.visible}
            disableEnforceFocus // Allows other things to take focus
            hideBackdrop  // Hides the shaded backdrop
            onClose={this.toggleDetailsVisibility}
            PaperComponent={PaperComponent}
            componentsProps={{ backdrop: { style: { backgroundColor: "transparent" } } }}
            style={{
              top: '30%', // Position however you like
              left: '30%',
              height: 'fit-content',  // Ensures that the dialog is 
              width: 'fit-content',   // exactly the same size as its contents
            }}
          >
            <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
              Pocket {this.props.pocket.rank}
            </DialogTitle>
            <DialogContent>
              <DialogContentText component={'div'}>
                <PocketDetails pocket={this.props.pocket} inDialog={true}/>
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button autoFocus onClick={event => this.toggleDetailsVisibility(event, 'btnClick')}>Close</Button>
            </DialogActions>
          </Dialog>
        </Draggable>
      </div>
    );
  }
}