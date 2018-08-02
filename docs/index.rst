.. Attitude documentation master file, created by
   sphinx-quickstart on Fri Jun  9 03:29:47 2017.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Introduction
========

**Attitude** is a Python module for fitting the orientation of planes in
three-dimensional space with meaningful error distributions. It also includes
Python and Javascript components to plot error distributions. This software
collectively represents the reference implementation of the statistical method
described in [this working paper](http://test.paper), currently in review at an
academic journal.

The methodology implemented here was developed to support the analysis of
geological orientations from remotely-sensed Mars imagery, but  Its core
mission is to compute planar fits and transform them (*along with meaningful
error distributions*) into a form that can be used for geology. It is designed
to support the collection of structural measurements from remote sensing data.

Statistical background
======================

Usage
=====

The module accepts input in the form of a *n*-by-3 matrix with columns
corresponding to X, Y, and Z coordinates. These data are commonly extracted
from linear or polygonal features on a digital elevation model.

A planar fit can be constructed as such:

```python
from attitude import Orientation
measurement = Orientation(array)
```

Contents:

.. toctree::
   :maxdepth: 2

   python-api.rst
   example-notebooks/Plotting-Attitudes.ipynb
   example-notebooks/Plotting-Interactive.ipynb

Attitude.orientation
====================

.. autoclass:: attitude.orientation.pca.PCAOrientation
    :members:

Attitude.error
==============

.. automodule:: attitude.error
    :members:

.. automodule:: attitude.error.axes
    :members:

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

