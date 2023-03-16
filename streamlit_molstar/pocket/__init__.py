import json
import sh
import csv
import os
import streamlit.components.v1 as components


# _DEVELOP_MODE = os.getenv('DEVELOP_MODE')
_DEVELOP_MODE = True
_RELEASE = not _DEVELOP_MODE

if not _RELEASE:
    _component_func = components.declare_component(
        "molstar_component_pocket",
        url="http://localhost:3001",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("molstar_component_pocket", path=build_dir)


def _load_structure_file(
        structure_file: str):
    with open(structure_file, encoding="utf-8") as stream:
        structure = json.load(stream)

    scores = {
        **structure["scores"]
    }

    return {
        "indices": structure["indices"],
        "sequence": structure["sequence"],
        "binding": structure["binding"],
        "regions": [
            {
                "name": region["name"],
                "start": region["start"],
                "end": region["end"],
            }
            for region in structure["regions"]
        ],
        "scores": scores
    }

def _load_pockets(predictions_file: str):
    with open(predictions_file) as stream:
        reader = csv.reader(stream)
        head = [value.strip() for value in next(reader)]
        predictions = [{
            key: value.strip()
            for key, value in zip(head, row)
        } for row in reader]
    return [
        {
            "name": prediction["name"],
            "rank": prediction["rank"],
            "score": prediction["score"],
            "probability": prediction["probability"],
            "center": [
                prediction["center_x"],
                prediction["center_y"],
                prediction["center_z"]
            ],
            "residues": prediction["residue_ids"].split(" "),
            "surface": prediction["surf_atom_ids"].split(" ")
        }
        for prediction in predictions
    ]


def st_molstar_pick_pocket(protein_file_path,  pockets_file_path, tmp_dir=None, height="240px", key=None):
    # cmd = sh.Command('/Users/wfluo/workspaces/prankweb/java-tools/dist/bin/java-tools')
    # from tempfile import NamedTemporaryFile
    # with NamedTemporaryFile(prefix='structure_', suffix='.json', dir=tmp_dir, delete=False) as sfd:
    #     sfname = sfd.name
    # with NamedTemporaryFile('w', prefix='task_config_', suffix='.txt', dir=tmp_dir, encoding='utf-8', delete=False) as tfd:
    #     tfd.write(f'structure-info --input {protein_file_path} --output {sfname}')
    # print(cmd.exec('-i', tfd.name, _fg=True))
    # info = {
    #     "structure": _load_structure_file(sfname),
    #     "pockets": _load_pockets(pockets_file_path),
    #     "metadata": {},
    # }
    # with open(protein_file_path) as f:
    #     content = f.read()
    # with open('a.json', 'w') as f:
    #     json.dump(info, f)
    # import streamlit as st
    # #st.json(info)
    return _component_func(key=key, height=height, default=None)


if (not _RELEASE) or os.getenv('SHOW_MOLSTAR_DEMO'):
    import streamlit as st
    st.set_page_config(layout="wide")
    st_molstar_pick_pocket('examples/pocket/protein.pdb', 'examples/pocket/protein.pdb_predictions.csv', tmp_dir='./var')