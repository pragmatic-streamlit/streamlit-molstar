import os
from urllib.parse import urlparse
from os.path import exists
import streamlit.components.v1 as components
from base64 import b64encode
import mrcfile
import numpy


def read_mrc(file_name: str) -> numpy.ndarray:
    with mrcfile.open(file_name) as mrc:
        isoType = "absolute" if sum(mrc.nstart.item()) == 0 else "relative"
        return numpy.copy(mrc.data).flatten(), isoType


def estimate_iso(x: numpy.ndarray, percentile: float = 99.) -> float:
    return numpy.percentile(x, percentile)


_DEVELOP_MODE = os.getenv("DEVELOP_MODE")
_RELEASE = not _DEVELOP_MODE


def is_local(url):
    url_parsed = urlparse(url)
    if url_parsed.scheme in ('file', ''):
        return exists(url_parsed.path)
    return False


if not _RELEASE:
    _component_func = components.declare_component(
        "molstar_component_auto",
        url="http://localhost:3001",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("molstar_component_auto", path=build_dir)


def covert_to_url(file):
    if isinstance(file, dict):
        options = file.get('options', {})
        format = file.get('format', 'auto')
        local_file = file.get('local')
        file = file['file']
    else:
        local_file = None
        format = 'auto'
        options = {}

    isoType = options.get("isoType", "absolute")
    if local_file or is_local(file):
        local_file = local_file or file
        if local_file.endswith(".mrc"):
            x, isoType = read_mrc(local_file)
            x_positive = x[x > 0]
            iso = estimate_iso(x_positive, options.get("percentile", 99.))
            options["isoValue"] = iso
    options["isoType"] = isoType

    if is_local(file):
        return {
            "source": "data",
            "format": format,
            "data": b64encode(open(file, "rb").read()).decode("ascii"),
            "name": file,
            "options": options,
        }
    return {
        "source": "url",
        "url": file,
        "format": format,
        "name": file,
        "options": options,
    }


def st_molstar_auto(files, *, height="240px", key=None):
    files = [covert_to_url(file) for file in files]
    component_value = _component_func(
        height=height,
        files=files, key=key, default=None)

    return component_value


if (not _RELEASE) or os.getenv("SHOW_MOLSTAR_DEMO"):
    import streamlit as st

    st.set_page_config(layout="wide")

    st.write("from remote url")
    files = ["https://files.rcsb.org/download/3PTB.pdb", "https://files.rcsb.org/download/1LOL.pdb"]
    st_molstar_auto(files, key="6", height="320px")

    st.write("from local file")
    files = ['examples/7bcq.pdb', "examples/7bcq.mrc"]
    st_molstar_auto(files, key="7", height="320px")
    
    # files = ['examples/fff_output_backbone.mrc']
    # st_molstar_auto(files, key="8", height="320px")
