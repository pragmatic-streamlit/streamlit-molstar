from setuptools import setup, find_packages

setup(
    name='streamlit-molstar',
    version='0.4.6',
    author='mapix',
    author_email='mapix.me@gmail.com',
    packages=find_packages(),
    include_package_data=True,
    install_requires=['streamlit', 'mrcfile', 'numpy'],
    url='https://github.com/pragmatic-streamlit/streamlit-molstar',
    long_description=open('README.md').read(),
    long_description_content_type="text/markdown",
    classifiers=[
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "License :: OSI Approved",
        "Topic :: Scientific/Engineering",
    ]
)