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
    version=0.0,
    description="Attitude computes the orientations of planes from point data.",
    license='BSD',
    keywords='gis data computation fitting statistics vector science geology',
    author='Daven Quinn',
    author_email='code@davenquinn.com',
    maintainer='Daven Quinn',
    install_requires=install_requires,
    test_suite="nose.collector",
    maintainer_email='code@davenquinn.com',
    url='http://github.com/davenquinn/Attitude',
    tests_require=['nose'],
    test_suite='nose.collector',
    ext_modules=ext_modules,
    classifiers=[
        'Development Status :: 2 - Pre-Alpha',
        'Intended Audience :: Science/Research',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Scientific/Engineering :: GIS',
    ],
)