Tools for error analysis for remotely-sensed planar orientations
================================================================

Surface orientation measurements are critical geological data, serving as
the foundational descriptors of bedding, faults, folds, and rock deformational
fabrics. This information, in turn, drives models of depositional, alteration,
and tectonic processes.

Remote-sensing tools (e.g. photogrammetric digital surface models derived from
aerial and satellite data) allow orientation measurements in new contexts, such
as Mars science. However, remote-sensing datasets entail new and complex
dataset- and scene-dependent errors. Some examples include:

- Sensor-geometry errors (e.g. stereo separation, LiDAR point density)
- The geometry of the hillslope over which a plane can be traced
- Errors imparted by the processing pipeline (e.g. imperfect photogrammetric
  image registration)
- Imperfect digitization of features (user error)

Typical methods for measuring, visualizing, and reporting surface orientations
do not anticipate or track errors in individual measurements. Furthermore, the
scale of these errors often varies within a single scene!
**Statistical and software tools to support error assessment of potentially
noisy data are critical for the effective use of remotely-sensed
geological orientations.**

**Attitude** is a Python module for fitting the orientation of planes in
three-dimensional space *with meaningful error distributions*. This software is
the reference implementation of the statistical technique and visualization
methods described in

.. bibliography:: refs/refs.bib
   :filter: key == quinn2019a
   :style: unsrt
   :list: bullet

The error-analysis and visualization process developed here is geared to
produce accurate and consistent representations of geological orientations from
remote-sensing data. The methodology was primarily developed to support the
analysis of geological orientations from Mars imagery and photogrammetric
elevation models, but it can be applied to any remote-sensing dataset.
The method's flexibility and independence from input view geometry
make it particularly suited to uncrewed aerial vehicle (UAV) and
ad-hoc structure-from-motion (SfM) datasets.

This methodology has formed the foundation for several papers in Mars science
using orbital and rover-based photogrammetric 3D models:

.. bibliography:: refs/refs.bib
   :filter: key != quinn2019a
   :style: unsrt
   :list: bullet

Work is ongoing to integrate this method into the UAV community.

Statistical and visualization components
----------------------------------------

This work encompasses both a general statistical framework and new ways to visualize
orientation error ellipses. These components are separable, and it is anticipated
that some workers may want to adjust the underlying statistical model for specific
situations and data types.

By default, the method uses principal-component analysis (PCA)
to perform an orientation-independent regression. The Python module also contains
helpers for plotting orientation data on one of several spherical axes.
Several Javascript components, developed in tandem with the Python module
are included to plot error distributions for spherical orientation data.

Contents
--------

.. toctree::
   :maxdepth: 2

   statistical-motivation.rst
   installation.rst
   python-api.rst
   example-notebooks.rst

Usage
=====

The module accepts input in the form of a *n*-by-3 matrix with columns
corresponding to X, Y, and Z coordinates. These data are commonly extracted
from linear or polygonal features on a digital elevation model.

A planar fit can be constructed as such::

  from attitude import Orientation
  measurement = Orientation(array)

Installation
============

Attitude is packaged as a standard Python module. The latest version
is available on PyPI and can be installed using PIP::

   pip install Attitude

If you want to use the development version (which is generally
more up-to-date), you can instead run::

   pip install git+git://github.com/davenquinn/Attitude.git

Contributing
============

Submit an issue on GitHub, or even better, submit a pull request.
We are especially open to implementing new statistical cores.

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
