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
    cov = N.sqrt(obj.covariance_matrix)

    def sdot(a,b):
        return sum([i*j for i,j in zip(a,b)])

    def step_func(a):
        a = [N.cos(a),N.sin(a)]
        b = cov[:2].T
        e = N.array([sdot(a,i) for i in b])
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

def test_javascript_plane():
    """
    Test plane functions implemented
    in javascript
    """

    for i,sheet in cases():
        p = N.array(random_plane()[0]).T
        obj = Orientation(p)
        err = obj.plane_errors(sheet=sheet, n=100)

        # Send file to javascript
        d = dict(
            covariance=N.sqrt(obj.covariance_matrix).tolist(),
            axes=obj.axes.tolist(),
            sheet=sheet,
            n=n)
        cmd = ('coffee', script, dumps(d))
        output = check_output(cmd)
        d1 = loads(output)
        arr = N.array(d1['data'])

        assert N.allclose(err,arr)

