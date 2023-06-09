import {StreamlitComponentBase, withStreamlitConnection} from "streamlit-component-lib";
import React, {ReactNode} from "react";
import {Mol2DSelector} from "./molecular";
interface State {}

class App extends StreamlitComponentBase<State> {
    public render = (): ReactNode => {
        const height = this.props.args["height"]
        const modelFile = this.props.args["modelFile"]
        const trajFile = this.props.args["trajFile"]

        if (modelFile && modelFile.data) {
            modelFile.data = this.props.args["modelFile_data"]
        }
        if (trajFile && trajFile.data) {
            trajFile.data = this.props.args["trajFile_data"]
        }

        return (
            <div style={{ height: height }}>
                <Mol2DSelector
                    smiles={'CC(C)CN(CC(C(CC1CCCCC1)NC(OC1C(CCO2)C2OC1)=O)O)S(C(CC1)CCC1N)(=O)=O'}
                    onMol2DInstanceCreated={(instance, selectionWithHydrogen) => {
                        console.log(instance, selectionWithHydrogen)
                    }}
                    onSelectionChanged={(selection, selectionWithHydrogen) => {
                        console.log(selection, selectionWithHydrogen)
                    }}
                    selection={[]}
                />
            </div>
        )
    }
}

// class TestApp extends React.Component {
//     public render = (): ReactNode => {
//         return (
//             <div>
//                 <Mol2DSelector
//                     smiles={'CC(C)CN(CC(C(CC1CCCCC1)NC(OC1C(CCO2)C2OC1)=O)O)S(C(CC1)CCC1N)(=O)=O'}
//                     onMol2DInstanceCreated={(instance, selectionWithHydrogen) => {
//                         console.log(instance, selectionWithHydrogen)
//                     }}
//                     onSelectionChanged={(selection, selectionWithHydrogen) => {
//                         console.log(selection, selectionWithHydrogen)
//                     }}
//                     selection={[]}
//                 />
//             </div>
//         )
//     }
// }
// export default TestApp
export default withStreamlitConnection(App)
