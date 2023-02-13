# streamlit-molstar

[Mol*](https://molstar.org/) (/'molstar/) is a modern web-based open-source toolkit for visualisation and analysis of large-scale molecular data.



Usage:
```python
    import streamlit as st
    st_molstar_rcsb('1LOL', key='xx')
    st_molstar_remote("https://files.rcsb.org/view/1LOL.cif", key='sds')
    st_molstar('examples/complex.pdb',key='3')
    st_molstar('examples/complex.pdb', 'examples/complex.xtc', key='4')
```

![](examples/example.png)