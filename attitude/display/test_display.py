from __future__ import print_function

import pytest
import numpy as N
from subprocess import check_output
from json import dumps, loads
from os import path
from mplstereonet.stereonet_math import cart2sph
from itertools import product
from codecs import getreader

from ..orientation.test_pca import random_pca
from ..stereonet import (plane_errors, iterative_plane_errors,
        normal_errors, iterative_normal_errors)
from ..geom.util import dot

n = 100
sheets = ('upper','lower','nominal')

cases = lambda: product(range(10),sheets)

def test_simple_plane():
    for i,sheet in cases():
        obj = random_pca()
        args = (obj.axes,obj.covariance_matrix)
        kwargs = dict(sheet=sheet, n=n, traditional_layout=True, adaptive=False)
        err = N.array(plane_errors(*args,**kwargs))
        arr = iterative_plane_errors(*args,**kwargs)
        assert N.allclose(err,arr)

def __simple_ellipse(**kwargs):
    for i in range(10):
        obj = random_pca()
        args = (obj.axes, obj.covariance_matrix)
        v1 = normal_errors(*args, **kwargs)
        v2 = iterative_normal_errors(*args, **kwargs)
        assert len(v1) == len(v2)
        assert N.allclose(v1,v2)

@pytest.mark.xfail(reason="Not sure why, but it isn't good.")
def test_simple_ellipse():
    __simple_ellipse(n=n, traditional_layout=True, adaptive=False)
    __simple_ellipse(n=n, traditional_layout=False, adaptive=False)

