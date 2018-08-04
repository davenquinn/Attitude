.. Attitude documentation master file, created by
   sphinx-quickstart on Fri Jun  9 03:29:47 2017.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Introduction
========

**Attitude** is a Python module for fitting the orientation of planes in
three-dimensional space *with meaningful error distributions*. This is thought
to be a crucial ingredient in accurate and consistent studies of geological orientations from remote sensing data.

The methodology implemented here was developed to support the analysis of
geological orientations from remotely-sensed Mars imagery, but it can be applied
to any remote-sensing dataset that produces points along a planar feature.
The method's flexibility and independence from input view geometry make it
particularly suited to unmanned aerial vehicle (UAV) and ad-hoc
structure-from-motion (SfM) datasets.

This Python module represents the reference implementation of the statistical method described in `this working paper <http://test.paper>`_, currently in review at an academic journal. By default, the method uses principal-component analysis (PCA)
to perform an orientation-independent regression. The Python module also contains
helpers for plotting orientation data on one of several spherical axes.
Several Javascript components, developed in tandem with the Python module, are included to plot error distributions for spherical orientation data.

Contents
--------

.. toctree::
   :maxdepth: 2

   statistical-motivation.rst
   installation.rst
   python-api.rst
   example-notebooks/Plotting-Attitudes.ipynb
   example-notebooks/Plotting-Interactive.ipynb

Usage
=====

The module accepts input in the form of a *n*-by-3 matrix with columns
corresponding to X, Y, and Z coordinates. These data are commonly extracted
from linear or polygonal features on a digital elevation model.

A planar fit can be constructed as such:::

  from attitude import Orientation
  measurement = Orientation(array)

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

