import json
from typing import Tuple
import sh
import csv
import os
import hashlib
from pathlib import Path
from tempfile import gettempdir
import streamlit as st

import streamlit.components.v1 as components

TMP_ROOT = Path(gettempdir()) / "streamlit-molstar"
TMP_ROOT.mkdir(exist_ok=True)
PARENT_DIR = Path(os.path.dirname(os.path.abspath(__file__)))

_DEVELOP_MODE = os.getenv('DEVELOP_MODE')

if _DEVELOP_MODE:
    _component_func = components.declare_component(
        "molstar_component_pocket",
        url="http://localhost:3001",
    )
else:
    build_dir = str(PARENT_DIR / "frontend" / "build")
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

def _get_file_type(file_path):
    return os.path.splitext(file_path)[1][1:].lower()

def get_workspace_info(md5hash, ftype, fresh=False, create=True):
    workdir_p = TMP_ROOT / md5hash
    if fresh and workdir_p.exists():
        sh.rm('-r', str(workdir_p))
    if create:
        workdir_p.mkdir(parents=True, exist_ok=True)
    protein_name = f'{md5hash}-protein.{ftype}'
    protein_file_path_p = workdir_p / protein_name
    structure_file_path_p = TMP_ROOT / md5hash / f'structure.json'
    pockets_file_path_p = TMP_ROOT / md5hash / f'{protein_name}_predictions.csv'
    return {
        "workdir": str(workdir_p), 
        "protein_file_path": str(protein_file_path_p),
        "structure_file_path": str(structure_file_path_p), 
        "pockets_file_path": str(pockets_file_path_p),
    }

def gen_structure(workspace_info):
    cmd = sh.Command('java')
    task_file_path_p = Path(workspace_info['workdir']) / "task.txt"
    with task_file_path_p.open('w') as f:
        f.write(f'structure-info --input {workspace_info["protein_file_path"]} --output {workspace_info["structure_file_path"]}')
    cmd('-jar', str(PARENT_DIR / 'java-tools'), 'exec', '-i', str(task_file_path_p), _fg=True)


def get_success_workspace_info(md5hash, ftype):
    workspace_info = get_workspace_info(md5hash, ftype, fresh=False, create=False)
    for v in workspace_info.values():
        if not os.path.exists(v):
            return
    return workspace_info


def get_workspace_info_from_content(fcontent, ftype, md5hash) -> Tuple[Path]:
    workspace_info = get_workspace_info(md5hash, ftype, fresh=True, create=True)

    with open(workspace_info['protein_file_path'], 'wb') as f:
        f.write(fcontent)
    gen_structure(workspace_info)

    return workspace_info


def get_workspace_info_from_path(protein_file_path, md5hash, ftype) -> Tuple[Path]:
    workspace_info = get_workspace_info(md5hash, ftype, fresh=True, create=True)
    sh.cp(protein_file_path, workspace_info['protein_file_path'])
    gen_structure(workspace_info)
    return workspace_info


def st_molstar_pockets(protein_file_path, structure_file_path, pockets_file_path, *, preview=True, key=None):
    with open(protein_file_path) as f:
        content = f.read()

    info = {
        "structure": _load_structure_file(structure_file_path),
        "pockets": _load_pockets(pockets_file_path),
        "metadata": {},
    }
    params = {
        "proteinFile": {
            "data": "<placeholder>",
            "format": _get_file_type(protein_file_path),
        },
        "proteinFile_data": content,
        "pocketsFile": {
            "data": "<placeholder>",
        },
        "pocketsFile_data": json.dumps(info),
    }
    if preview:
        _component_func(**params, key=key, default=None)
    return {
        i['name']: i for i in info['pockets']
    }


def get_pockets_from_local_protein(protein_file_path, *, p2rank_home=None, preview=True, key=None):
    p2rank_home = p2rank_home or os.getenv('P2RANK_HOME')
    assert p2rank_home
    with open(protein_file_path) as f:
        content = f.read()
    if isinstance(content, str):
        content = content.encode('utf-8')
    md5hash = hashlib.md5(content).hexdigest()
    
    ftype = _get_file_type(protein_file_path)
    workspace_info = get_success_workspace_info(md5hash, ftype)
    if not workspace_info:    
        if st.button('Start Discover Pockets'):
            with st.spinner('Calculating...'):
                workspace_info = get_workspace_info_from_content(content, ftype, md5hash)
                predict_path_p = Path(workspace_info['workdir']) / 'predict'
                cmd = sh.Command(os.path.join(p2rank_home, 'prank'))
                args = ['predict', '-f', workspace_info['protein_file_path'], '-o', str(predict_path_p)]
                cmd(*args, _cwd=p2rank_home, _fg=True)
                protein_file_name = os.path.basename(workspace_info['protein_file_path'])
                tmp_pockets_file_path_p = predict_path_p / f'{protein_file_name}_predictions.csv'
                sh.cp(str(tmp_pockets_file_path_p), workspace_info['pockets_file_path'])
    if workspace_info:
        pockets = st_molstar_pockets(workspace_info['protein_file_path'],
                                     workspace_info['structure_file_path'],
                                     workspace_info['pockets_file_path'], preview=preview, key=key)
        return pockets  


def select_pocket_from_local_protein(protein_file_path, *, multi_select=False,  preview=True, p2rank_home=None, key=None):
    pockets = get_pockets_from_local_protein(protein_file_path, p2rank_home=p2rank_home, preview=preview, key=key)
    if pockets:
        if multi_select:
           selected_pockets = st.multiselect('Choose Pocket', pockets.keys(), format_func=lambda x: f"{x} | {pockets[x]}", key=f'{key}-select-box')
           selected = [pockets[i] for i in selected_pockets]
        else:
           selected_pocket = st.selectbox('Choose Pocket', pockets.keys(), format_func=lambda x: f"{x} | {pockets[x]}", key=f'{key}-select-box')
           selected = pockets[selected_pocket]
        return selected


def get_pockets_from_local_protein(protein_file_path, *, p2rank_home=None, preview=True, key=None):
    p2rank_home = p2rank_home or os.getenv('P2RANK_HOME')
    assert p2rank_home
    with open(protein_file_path, 'rb') as f:
        md5hash = hashlib.md5(f.read()).hexdigest()
        ftype = _get_file_type(protein_file_path)
    workspace_info = get_success_workspace_info(md5hash, ftype)
    if not workspace_info:    
        if st.button('Start Discover Pockets'):
            with st.spinner('Calculating...'):
                workspace_info = get_workspace_info_from_path(protein_file_path, md5hash, ftype)
                predict_path_p = Path(workspace_info['workdir']) / 'predict'
                cmd = sh.Command(os.path.join(p2rank_home, 'prank'))
                args = ['predict', '-f', workspace_info['protein_file_path'], '-o', str(predict_path_p)]
                cmd(*args, _cwd=p2rank_home, _fg=True)
                protein_file_name = os.path.basename(workspace_info['protein_file_path'])
                tmp_pockets_file_path_p = predict_path_p / f'{protein_file_name}_predictions.csv'
                sh.cp(str(tmp_pockets_file_path_p), workspace_info['pockets_file_path'])
    if workspace_info:
        pockets = st_molstar_pockets(workspace_info['protein_file_path'],
                                     workspace_info['structure_file_path'],
                                     workspace_info['pockets_file_path'], preview=preview, key=key)
        return pockets


def select_pocket_from_upload_protein(*, multi_select=False, p2rank_home=None, preview=True, key=None):
    file = st.file_uploader('Protein', type='pdb')
    if file:
        ftype = _get_file_type(file.name)
        return select_pocket_from_protein_content(file.getvalue(), ftype, multi_select=multi_select, p2rank_home=p2rank_home, preview=preview, key=key)


def select_pocket_from_protein_content(content, ftype, *, multi_select=False, p2rank_home=None, preview=True, key=None):
    pockets = get_pockets_from_protein_content(content, ftype, p2rank_home=p2rank_home, preview=preview, key=key)
    if pockets:
        if multi_select:
            selected_pockets = st.multiselect('Choose Pocket', pockets.keys(), format_func=lambda x: f"{x} | {pockets[x]}", key=f'{key}-select-box')
            selected = [pockets[i] for i in selected_pockets]
        else:
            selected_pocket = st.selectbox('Choose Pocket', pockets.keys(), format_func=lambda x: f"{x} | {pockets[x]}", key=f'{key}-select-box')
            selected = pockets[selected_pocket]
    return selected


def get_pockets_from_protein_content(content, ftype, *, p2rank_home=None, preview=True, key=None):
    p2rank_home = p2rank_home or os.getenv('P2RANK_HOME')
    assert p2rank_home
    if isinstance(content, str):
        content = content.encode('utf-8')
    md5hash = hashlib.md5(content).hexdigest()
    
    workspace_info = get_success_workspace_info(md5hash, ftype)
    if not workspace_info:    
        if st.button('Start Discover Pockets'):
            with st.spinner('Calculating...'):
                workspace_info = get_workspace_info_from_content(content, ftype, md5hash)
                predict_path_p = Path(workspace_info['workdir']) / 'predict'
                cmd = sh.Command(os.path.join(p2rank_home, 'prank'))
                args = ['predict', '-f', workspace_info['protein_file_path'], '-o', str(predict_path_p)]
                cmd(*args, _cwd=p2rank_home, _fg=True)
                protein_file_name = os.path.basename(workspace_info['protein_file_path'])
                tmp_pockets_file_path_p = predict_path_p / f'{protein_file_name}_predictions.csv'
                sh.cp(str(tmp_pockets_file_path_p), workspace_info['pockets_file_path'])
    if workspace_info:
        pockets = st_molstar_pockets(workspace_info['protein_file_path'],
                                     workspace_info['structure_file_path'],
                                     workspace_info['pockets_file_path'], preview=preview, key=key)
        return pockets        

if _DEVELOP_MODE or os.getenv('SHOW_MOLSTAR_DEMO'):
    import streamlit as st
    st.set_page_config(layout="wide")
    
    func = st.selectbox('Mode', ['Upload', 'Example'])
    if func == 'Upload':
        selected = select_pocket_from_upload_protein(p2rank_home='/Users/wfluo/Downloads/p2rank_2.4/')
    else:
        selected = select_pocket_from_local_protein("examples/pocket/protein.pdb", p2rank_home='/Users/wfluo/Downloads/p2rank_2.4/')
    if selected:
        pocket = selected
        st.write('Selected Pocket: ', pocket)