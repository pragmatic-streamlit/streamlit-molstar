import os
import streamlit.components.v1 as components


_DEVELOP_MODE = os.getenv("DEVELOP_MODE")
_RELEASE = not _DEVELOP_MODE


if not _RELEASE:
    _component_func = components.declare_component(
        "molstar_component_auto",
        url="http://localhost:3001",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("molstar_component_auto", path=build_dir)


def st_molstar_auto(files, *, height="240px", key=None):
    component_value = _component_func(
        height=height,
        files=files, key=key, default=None)

    return component_value


if (not _RELEASE) or os.getenv("SHOW_MOLSTAR_DEMO"):
    import streamlit as st

    st.set_page_config(layout="wide")
    files = ["https://files.rcsb.org/download/3PTB.pdb", "http://localhost:8000/fff_output_backbone.mrc", "http://localhost:8000/fff_output_infer.pdb"]
    st_molstar_auto(files, height="800px")
