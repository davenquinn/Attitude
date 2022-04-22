"""
Helper functions for rotations

Prior art: http://bl.ocks.org/ivyywang/7c94cb5a3accd9913263
"""
from __future__ import division

import numpy as N
from mplstereonet import stereonet2xyz, stereonet_math, xyz2stereonet

from ..geom.util import angle, dot, vector


def transform(v1, v2):
    """
    Create an affine transformation matrix that maps vector 1
    onto vector 2

    https://math.stackexchange.com/questions/293116/rotating-one-3d-vector-to-another
    """
    theta = angle(v1, v2)
    x = N.cross(v1, v2)
    x = x / N.linalg.norm(x)

    A = N.array([[0, -x[2], x[1]], [x[2], 0, -x[0]], [-x[1], x[0], 0]])
    R = N.exp(A * theta)

    return R


def stereonet_transformation():
    """
    Map vertical to horizontal

    Map [1,0,0] to [0,0,1]
        stereonet  normal
    """
    T = N.array([[0, 0, 1], [0, 1, 0], [1, 0, 0]])
    return T


def cartesian(lon, lat):
    """
    Converts spherical positions in (lon, lat) to cartesian coordiantes [x,y,z].
    For the purposes of this library's focus on orientations, this operates in a
    *north = vertical* framework. That is, positions around the equator are in the
    [x,y] plane, and dipping planes occur with higher latitudes.

    This is intuitive for strike and dip representations, as it maps
    (strike, dip) to (lon, lat). However, we note that it is distinct from the
    traditional stereonet representation, which puts the X-Y plane along the prime
    meridian.
    """
    return N.array([N.cos(lat) * N.cos(lon), N.cos(lat) * N.sin(lon), N.sin(lat)])


def from_stereonet(lon, lat):
    x, y, z = stereonet_math.sph2cart(lon, lat)
    return stereonet_math.cart2sph(y, z, -x)


def to_stereonet(lon, lat):
    x, y, z = stereonet_math.sph2cart(lon, lat)
    return stereonet_math.cart2sph(-z, x, y)
