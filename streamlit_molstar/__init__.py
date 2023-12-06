import os
import streamlit.components.v1 as components
from base64 import b64encode

# Create a _RELEASE constant. We'll set this to False while we're developing
# the component, and True when we're ready to package and distribute it.
# (This is, of course, optional - there are innumerable ways to manage your
# release process.)
_DEVELOP_MODE = os.getenv("DEVELOP_MODE")
# _DEVELOP_MODE = True

_RELEASE = not _DEVELOP_MODE

# Declare a Streamlit component. `declare_component` returns a function
# that is used to create instances of the component. We're naming this
# function "_component_func", with an underscore prefix, because we don't want
# to expose it directly to users. Instead, we will create a custom wrapper
# function, below, that will serve as our component's public API.

# It's worth noting that this call to `declare_component` is the
# *only thing* you need to do to create the binding between Streamlit and
# your component frontend. Everything else we do in this file is simply a
# best practice.

if not _RELEASE:
    _component_func = components.declare_component(
        # We give the component a simple, descriptive name ("molstar_component"
        # does not fit this bill, so please choose something better for your
        # own component :)
        "molstar_component",
        # Pass `url` here to tell Streamlit that the component will be served
        # by the local dev server that you run via `npm run start`.
        # (This is useful while your component is in development.)
        url="http://localhost:3001",
    )
else:
    # When we're distributing a production version of the component, we'll
    # replace the `url` param with `path`, and point it to to the component's
    # build directory:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("molstar_component", path=build_dir)


def _get_file_type(file_path):
    _type = os.path.splitext(file_path)[1][1:].lower()
    type_mapping = {
        "cif": "cifCore",
    }
    return type_mapping.get(_type, _type)


def st_molstar_rcsb(id, height="240px", key=None):
    url = f"https://files.rcsb.org/view/{id}.cif"
    st_molstar_remote(url, height=height, key=key)


def st_molstar(
    file_path, traj_file_path=None, height="240px", key=None
):
    with open(file_path) as f:
        file_content = f.read()
        file_format = _get_file_type(file_path)
    if traj_file_path:
        with open(traj_file_path, "rb") as f:
            traj_file_content = f.read()
            traj_file_format = _get_file_type(traj_file_path)
    else:
        traj_file_content = None
        traj_file_format = None

    st_molstar_content(
        file_content,
        file_format,
        traj_file_content=traj_file_content,
        traj_file_format=traj_file_format,
        file_name=os.path.basename(file_path),
        traj_file_name=traj_file_path and os.path.basename(traj_file_path),
        height=height,
        key=key,
    )


def st_molstar_content(
    file_content,
    file_format,
    traj_file_content=None,
    traj_file_format=None,
    *,
    file_name=None,
    traj_file_name=None,
    height="240px",
    key=None,
):
    params = {
        "scene": "basic",
        "height": height,
        "modelFile": {
            "name": file_name or f"unknown.{file_format}",
            "data": "<placeholder>",  # FIXME as Python -> JavaScript encoding error, So put data parent Level
            "format": file_format,
        },
        "modelFile_data": file_content,
    }
    if traj_file_content:
        params["trajFile"] = {
            "name": traj_file_name or f"unknown.{traj_file_format}",
            "data": "<placeholder>",
            "format": traj_file_format,
        }
        params["trajFile_data"] = traj_file_content
    _component_func(key=key, default=None, **params)


def st_molstar_remote(url, traj_url=None, height="240px", key=None):
    params = {
        "scene": "basic",
        "height": height,
        "modelFile": {
            "name": os.path.basename(url),
            "url": url,
            "format": _get_file_type(url),
        },
    }
    if traj_url:
        params["trajFile"] = {
            "name": os.path.basename(traj_url),
            "url": traj_url,
            "format": _get_file_type(traj_url),
        }
    _component_func(key=key, default=None, **params)


# Add some test code to play with the component while it's in development.
# During development, we can run this just as we would any other Streamlit
# app: `$ streamlit run molstar_component/__init__.py`
if (not _RELEASE) or os.getenv("SHOW_MOLSTAR_DEMO"):
    import streamlit as st

    # st_molstar('examples/cluster_400.gro', key="li_test")

    # st_molstar_rcsb('1LOL', key='xx')
    # st_molstar_remote("https://files.rcsb.org/view/1LOL.cif", key='sds')
    # st_molstar('examples/complex.pdb', key='3')
    # st_molstar('examples/cluster_of_100.gro', key='5')
    # st_molstar('examples/md.gro',key='6')
    # st_molstar('examples/H2O.cif',key='7')
    st_molstar('../examples/complex.pdb', '../examples/complex.xtc', key='4')
    st_molstar("../pchem/polyALA.pdb", "../pchem//polyALA_traj.dcd", key="10")
    st_molstar_remote("http://localhost:8000/polyALA.pdb", "http://localhost:8000/polyALA_traj.dcd")
