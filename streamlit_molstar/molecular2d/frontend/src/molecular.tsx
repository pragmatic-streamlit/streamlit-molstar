import React, { useCallback, useEffect, useRef } from 'react';
import { useResizeObserver } from 'react-use-observer';

const getHeight = (width: number) => (2 * width) / 3;

interface Mol2DSelectorProps {
    onMol2DInstanceCreated: (instance: any, selectionWithHydrogen: number[]) => void;
    onSelectionChanged: (selection: number[], selectionWithHydrogen: number[]) => void;
    selection: number[];
    mol?: string;
    smiles?: string;
}

export const Mol2DSelector = React.memo((props: Mol2DSelectorProps) => {
    const {
        mol,
        smiles,
        selection,
        onMol2DInstanceCreated,
        onSelectionChanged,
    } = props;
    // const scale = useRef<number>(1);
    const domRef = useRef<any>();
    const selector = useRef<any>();
    const resize = useRef<any>();
    const highlightAtom = useRef<number | undefined>(undefined);
    const highlightBond = useRef<number | undefined>(undefined);
    const isMoving = useRef<boolean>(false);
    const [ref, resizeObserverEntry] = useResizeObserver();
    const { width = 0 } = resizeObserverEntry.contentRect || {};
    const hydrogenObj = useRef<{ [key: number]: Set<number> }>({});

    // const onScale = (scaleStep: number) => {
    //     const { mMol } = selector.current.model;
    //     const newScale = scale.current + scaleStep;
    //     const center = { x: width / 2, y: getHeight(width) / 2 };
    //     const rate = newScale / scale.current;
    //     mMol.mCoordinates.forEach((atom: { x_0: number; y_0: number }, index: number) => {
    //         mMol.mCoordinates[index].x_0 = atom.x_0 + (atom.x_0 - center.x) * (rate - 1);
    //         mMol.mCoordinates[index].y_0 = atom.y_0 + (atom.y_0 - center.y) * (rate - 1);
    //     });
    //     scale.current = newScale;
    //     selector.current.drawPane.draw();
    // };
    const getSelectedAtoms = useCallback((withHydrogen?: boolean) => {
        if (!selector?.current?.model) {
            return [];
        }
        const { mMol } = selector.current.model;
        const selected = [];
        for (let atom = 0; atom < mMol.getAllAtoms_0(); atom++) {
            if (mMol.isSelectedAtom_0(atom)) {
                selected.push(atom);
                if (withHydrogen && hydrogenObj.current[atom]?.size) {
                    hydrogenObj.current[atom].forEach(atom => {
                        selected.push(atom);
                    });
                }
            }
        }
        return selected;
    }, []);

    useEffect(() => {
        if (!domRef.current || width <= 0) return;
        if (!selector.current) {
            selector.current = new window.OCL.StructureEditor(domRef.current, true, 1);
            const instance = selector.current;
            if (mol) {
                instance.model.setMolFile_0(mol);
            } else {
                instance.model.setSmiles_0(smiles);
            }
            instance.toolBar.currentAction.shift_0 = true;
            instance.toolBar.currentAction.rectangular = true;
            instance.model.mMol.mConnAtom.forEach((atoms: [], atomId: number) => {
                atoms.forEach((atom: number) => {
                    if (instance.model.mMol.mAtomicNo[atom] === 1) {
                        hydrogenObj.current[atomId] = hydrogenObj.current[atomId] || new Set();
                        hydrogenObj.current[atomId].add(atom);
                    }
                });
            });
            selector.current.model.mMol.removeExplicitHydrogens_0();
            instance.model.cleanMolecule();
            instance.setAtomHightlightCallback((atom: number, selected: boolean) => {
                highlightAtom.current = selected ? atom : undefined;
            });
            instance.setBondHightlightCallback((bond: number, selected: boolean) => {
                highlightBond.current = selected ? bond : undefined;
            });

            // if (!isEditing) {
            //     // @ts-ignore
            //     // eslint-disable-next-line no-underscore-dangle
            //     window.__dp_mol2d_selector_locked = true;
            //     instance.drawPane.backgroundColor = '#FFFFFF';
            // }
            selection.forEach((atom: number) => {
                instance.model.mMol.setAtomSelection_0(atom, true);
            });
            instance.drawPane.draw();
            // @ts-ignore
            // eslint-disable-next-line no-underscore-dangle
            window.__selector = selector.current;
            onMol2DInstanceCreated(selector.current, getSelectedAtoms(true));
        } else {
            if (resize.current) clearTimeout(resize.current);
            resize.current = setTimeout(() => {
                selector.current.drawPane.setSize_0(width, getHeight(width));
            }, 500);
        }
    }, [getSelectedAtoms, mol, onMol2DInstanceCreated, selection, smiles, width]);

    // useEffect(() => {
    //     if (!selector.current) return;
    //     const { drawPane } = selector.current;
    //     // @ts-ignore
    //     // eslint-disable-next-line no-underscore-dangle
    //     window.__dp_mol2d_selector_locked = !isEditing;
    //     if (isEditing) {
    //         drawPane.backgroundColor = '#F2F5FA';
    //         drawPane.draw();
    //     } else {
    //         drawPane.backgroundColor = '#FFFFFF';
    //         drawPane.draw();
    //     }
    // }, [isEditing]);

    return (
        <div ref={ref}>
            <div
                onMouseDown={() => {
                    isMoving.current = false;
                }}
                onMouseMove={() => {
                    isMoving.current = true;
                }}
                onClick={() => {
                    const { model, drawPane, toolBar } = selector.current;
                    if (highlightAtom.current !== undefined) {
                        const selected = !model.mMol.isSelectedAtom_0(highlightAtom.current);
                        model.mMol.setAtomSelection_0(highlightAtom.current, selected);
                        drawPane.draw();
                    } else if (highlightBond.current !== undefined) {
                        const atomA = model.mMol.mBondAtom[0][highlightBond.current];
                        const atomB = model.mMol.mBondAtom[1][highlightBond.current];
                        const selected = !model.mMol.isSelectedBond_0(highlightBond.current);
                        model.mMol.setAtomSelection_0(atomA, selected);
                        model.mMol.setAtomSelection_0(atomB, selected);
                        drawPane.draw();
                    } else if (isMoving.current) {
                        highlightAtom.current = undefined;
                        highlightBond.current = undefined;
                    } else {
                        toolBar.currentAction.deselectAllAtoms();
                        drawPane.draw();
                        highlightAtom.current = undefined;
                        highlightBond.current = undefined;
                    }
                    isMoving.current = false;
                    onSelectionChanged(getSelectedAtoms(), getSelectedAtoms(true));
                }}
                view-only="true"
                ref={domRef}
                style={{ width, height: getHeight(width) }}
            />
        </div>
    );
});
