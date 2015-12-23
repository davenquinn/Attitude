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

cases = product(range(10),sheets)

def test_simple_plane():
    for i in cases:
        p = N.array(random_plane()[0]).T
        obj = Orientation(p)
        err = obj.plane_errors(sheet='upper', n=100)

        cov = N.sqrt(obj.covariance_matrix)

        def sdot(a,b):
            return sum([i*j for i,j in zip(a,b)])

        def step_func(a):

            a = [N.cos(a),N.sin(a)]
            b = cov[:2].T
            #1x2 2x3 -> 1x3
            e = N.array([sdot(a,i) for i in b])

            e += cov[2]
            d = [sdot(e,i)
                for i in obj.axes.T]
            x,y,z = -d[2],d[0],d[1]
            r = N.sqrt(x**2 + y**2 + z**2)
            lat = N.arcsin(z/r)
            lon = N.arctan2(y, x)
            return lon,lat

        # Get a bundle of vectors defining
        # a full rotation around the unit circle
        arr = N.array([step_func(i)
            for i in u])

        assert N.allclose(err,arr)


def test_javascript_plane():
    """
    Test plane functions implemented
    in javascript
    """

    assert True
    return
    for i in cases:
        p = N.array(random_plane()[0]).T
        obj = Orientation(p)
        err = obj.plane_errors(sheet='upper', n=100)

        d = N.sqrt(obj.covariance_matrix)

        # Get a bundle of vectors defining
        # a full rotation around the unit circle
        angles = N.array([N.cos(u),N.sin(u)]).T
        ell = dot(angles,d[:2])

        res = d[2]
        ell += res

        _ = dot(ell,obj.axes).T
        lon,lat = cart2sph(-_[2],_[0],_[1])
        ell1 = N.array(zip(lon,lat))

        # Send file to javascript
        d = dict(data=ell1.tolist(),n=n)
        cmd = ('coffee', script, dumps(d))
        output = check_output(cmd)
        d1 = loads(output)
        arr = N.array(d1['data'])

        assert N.allclose(err,arr)

