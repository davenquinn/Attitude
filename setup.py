import os
from setuptools import setup, find_packages
here = os.path.abspath(os.path.dirname(__file__))

install_requires = [
    'numpy',
    'scipy',
    'matplotlib',
    'fiona',
    'shapely',
    'pyproj',
    'mplstereonet'
    ]

setup(
    name='Attitude',
    version=0.1,
    description="Attitude computes the orientations of planes from point data.",
    license='MIT',
    keywords='gis data computation fitting statistics vector science geology',
    author='Daven Quinn',
    author_email='code@davenquinn.com',
    maintainer='Daven Quinn',
    maintainer_email='code@davenquinn.com',
    url='http://github.com/davenquinn/Attitude',
    install_requires=install_requires,
    tests_require=['nose'],
    test_suite='nose.collector',
    packages=['attitude'],
    classifiers=[
        'Development Status :: 2 - Pre-Alpha',
        'Intended Audience :: Science/Research',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Scientific/Engineering :: GIS',
    ],
)