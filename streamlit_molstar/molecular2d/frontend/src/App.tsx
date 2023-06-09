import {StreamlitComponentBase, withStreamlitConnection} from "streamlit-component-lib";
import React, {ReactNode} from "react";
import {Mol2DSelector} from "./molecular";
interface State {}

class App extends StreamlitComponentBase<State> {
    ref: any = null
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
                        console.warn(instance, selectionWithHydrogen)
                        this.ref = instance
                    }}
                    onSelectionChanged={(selection, selectionWithHydrogen) => {
                        console.warn(selection, selectionWithHydrogen)
                        const selectedAtomsSet = new Set(selection);
                        if (selection.length < 5) {
                            console.warn('Select at least 5 heavy atoms.');
                            return;
                        }
                        if (
                            selection.length >= Math.floor(this.ref.model.mMol.getAllAtoms_0() * 0.9)
                        ) {
                            console.warn('Select up to 90% of heavy atoms.');
                            return;
                        }
                        const queue = [selection[0]];
                        while (queue.length) {
                            const start = queue.shift() as number;
                            selectedAtomsSet.delete(start);
                            this.ref.model.mMol.mConnAtom[start]?.forEach((conn: number) => {
                                if (selectedAtomsSet.has(conn)) {
                                    queue.push(conn);
                                    selectedAtomsSet.delete(conn);
                                }
                            });
                        }
                        if (selectedAtomsSet.size) {
                            console.warn('Selected atoms need to be connected.');
                            return;
                        }
                        console.log('success')
                    }}
                    selection={[]}
                />
            </div>
        )
    }
}
export default withStreamlitConnection(App)

// class TestApp extends React.Component<any, any> {
//     public render = (): ReactNode => {
//         return (
//             <div >
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
//
// export default TestApp
