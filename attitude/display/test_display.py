from __future__ import print_function

import pytest
import numpy as N
from subprocess import check_output
from json import dumps, loads
from os import path
from mplstereonet.stereonet_math import cart2sph
from itertools import product
from codecs import getreader

from ..test import random_plane
from .. import Orientation
from ..orientation.test_pca import random_pca
from ..stereonet import plane_errors, iterative_plane_errors
from ..geom.util import dot

here = path.dirname(__file__)
script = path.join(here,'assets','test-plane.coffee')

n = 100
sheets = ('upper','lower','nominal')

cases = lambda: product(range(10),sheets)

def test_simple_plane():
    for i,sheet in cases():
        obj = random_pca()
        args = (obj.axes,obj.covariance_matrix)
        kwargs = dict(sheet=sheet, n=n, traditional_layout=True)
        err = N.array(plane_errors(*args,**kwargs))
        arr = iterative_plane_errors(*args,**kwargs)
        assert N.allclose(err,arr)

def get_coffeescript(fn, d):
    """
    Get a function response from the coffeescript
    testing suite
    """
    cmd = ('coffee',script,fn,dumps(d))
    return loads(check_output(cmd).decode('utf-8'))

def __coffeescript_plane(data, function='individual'):
    d = [dict(
            singularValues=N.diagonal(
                obj.covariance_matrix).tolist(),
            axes=obj.axes.tolist(),
            sheet=obj.sheet,
            n=n) for obj in data]

    return get_coffeescript(function, d)

def input_data():
    for i, sheet in cases():
        obj = random_pca()
        obj.sheet = sheet
        yield obj

def test_javascript_plane():
    """
    Test plane functions implemented
    in javascript
    """
    data = list(input_data())
    output = __coffeescript_plane(data,'individual')
    for obj,arr in zip(data,output):
        arr = N.array(arr)
        err = plane_errors(
            obj.axes,
            obj.covariance_matrix,
            sheet=obj.sheet, n=100)
        assert N.allclose(err,arr)

def test_grouped_plane():
    data = list(input_data())
    output = __coffeescript_plane(data,'grouped')
    for obj,arr in zip(data,output):
        err = obj.error_coords(n=100)
        for i in ['nominal','upper','lower']:
            assert N.allclose(err[i],N.array(arr[i]))

def test_axis_deconvolution():
    """
    Test that we can recover PCA axes from
    premultiplied representation in javascript
    """
    pca = random_pca()
    sv,ax = get_coffeescript('deconvolveAxes',pca.singular_values.tolist())
    assert N.allclose(sv,pca.singular_values)

