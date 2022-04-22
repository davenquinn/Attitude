from __future__ import print_function

from itertools import product
from json import dumps, loads
from os import path
from subprocess import check_output

import numpy as N
import pytest
from mplstereonet.stereonet_math import cart2sph
from numpy.testing import assert_array_almost_equal

from ..geom.util import dot
from ..orientation.test_pca import random_pca
from ..stereonet import (
    iterative_normal_errors,
    iterative_plane_errors,
    normal_errors,
    plane_errors,
)

n = 100
sheets = ("upper", "lower", "nominal")

cases = lambda: product(range(10), sheets)


def test_upright_plane():
    axes = N.identity(3)
    cov = N.diag([1, 2, 0.5])
    args = (axes, cov)
    kwargs = dict(adaptive=False, n=100)
    err = plane_errors(*args, **kwargs)
    arr = iterative_plane_errors(*args, **kwargs)
    assert_array_almost_equal(err, arr)


def test_simple_plane():
    for i, sheet in cases():
        obj = random_pca()
        args = (obj.axes, obj.covariance_matrix)
        kwargs = dict(sheet=sheet, n=n, traditional_layout=True, adaptive=False)
        err = N.array(plane_errors(*args, **kwargs))
        arr = iterative_plane_errors(*args, **kwargs)
        assert_array_almost_equal(err, arr)


def __simple_ellipse(**kwargs):
    for i in range(10):
        obj = random_pca()
        args = (obj.axes, obj.covariance_matrix)
        v1 = normal_errors(*args, **kwargs)
        v2 = iterative_normal_errors(*args, **kwargs)
        assert_array_almost_equal(v1, v2)


def test_simple_ellipse():
    __simple_ellipse(n=n, traditional_layout=True, adaptive=False)
    __simple_ellipse(n=n, traditional_layout=False, adaptive=False)
