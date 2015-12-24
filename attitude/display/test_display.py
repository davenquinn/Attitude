from __future__ import print_function

import numpy as N
from subprocess import check_output
from json import dumps, loads
from os import path
from mplstereonet.stereonet_math import cart2sph
from itertools import product

from ..test import random_plane
from .. import Orientation
from ..geom.util import dot

here = path.dirname(__file__)
script = path.join(here,'assets','test-plane.coffee')

n = 100
u = N.linspace(0, 2*N.pi, n)
sheets = ('upper','lower','nominal')

cases = lambda: product(range(10),sheets)

def do_simple_plane(obj, sheet='upper'):
    """
    An iterative version of `pca.plane_errors`,
    which computes an error surface for a plane.
    """
    cov = N.sqrt(N.diagonal(obj.covariance_matrix))

    def sdot(a,b):
        return sum([i*j for i,j in zip(a,b)])

    def step_func(a):
        a = [N.cos(a),N.sin(a)]
        b = cov[:2]
        e = N.array([i*j for i,j in zip(a,b)])
        if sheet == 'upper':
            e += cov[2]
        elif sheet == 'lower':
            e -= cov[2]
        d = [sdot(e,i)
            for i in obj.axes.T]
        x,y,z = -d[2],d[0],d[1]
        r = N.sqrt(x**2 + y**2 + z**2)
        lat = N.arcsin(z/r)
        lon = N.arctan2(y, x)
        return lon,lat

    # Get a bundle of vectors defining
    # a full rotation around the unit circle
    return N.array([step_func(i)
        for i in u])

def test_simple_plane():
    for i,sheet in cases():
        p = N.array(random_plane()[0]).T
        obj = Orientation(p)
        err = obj.plane_errors(sheet=sheet, n=n)
        arr = do_simple_plane(obj, sheet)
        assert N.allclose(err,arr)

def get_coffeescript(data, mode='individual'):
    d = [dict(
            singularValues=N.diagonal(
                obj.covariance_matrix).tolist(),
            axes=obj.axes.tolist(),
            sheet=obj.sheet,
            n=n) for obj in data]

    cmd = ('coffee',script,mode,dumps(d))
    return loads(check_output(cmd))

def input_data():
    for i, sheet in cases():
        p = N.array(random_plane()[0]).T
        obj = Orientation(p)
        obj.sheet = sheet
        yield obj

def test_javascript_plane():
    """
    Test plane functions implemented
    in javascript
    """

    data = list(input_data())
    output = get_coffeescript(data,'individual')
    for obj,arr in zip(data,output):
        arr = N.array(arr)
        err = obj.plane_errors(sheet=obj.sheet, n=100)
        assert N.allclose(err,arr)

def test_grouped_plane():
    data = list(input_data())
    output = get_coffeescript(data,'grouped')
    for obj,arr in zip(data,output):
        err = obj.error_coords(n=100)
        for i in ['nominal','upper','lower']:
            assert N.allclose(err[i],N.array(arr[i]))

