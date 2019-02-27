import os
from setuptools import setup, find_packages
here = os.path.abspath(os.path.dirname(__file__))

install_requires = [
    'numpy',
    'scipy',
    'matplotlib',
    'mplstereonet',
    'jinja2',
    'colour',
    'pytest',
    'IPython'
    ]

setup(
    name='Attitude',
    version="0.4.0",
    description="Attitude computes the orientations of planes from point data.",
    license='MIT',
    keywords='gis data computation fitting statistics vector science geology',
    author='Daven Quinn',
    author_email='code@davenquinn.com',
    maintainer='Daven Quinn',
    maintainer_email='code@davenquinn.com',
    url='http://github.com/davenquinn/Attitude',
    install_requires=install_requires,
    tests_require=['nose','pytest'],
    test_suite='nose.collector',
    packages=find_packages(),
    package_dir={'attitude':'attitude'},
    include_package_data=True,
    classifiers=[
        'Development Status :: 2 - Pre-Alpha',
        'Intended Audience :: Science/Research',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Scientific/Engineering :: GIS',
    ],
)
