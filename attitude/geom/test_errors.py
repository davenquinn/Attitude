from __future__ import division

import numpy as N
from .vector import vector, plane
from .conics import conic

from scipy.linalg import lu

same = N.allclose

def test_conic_errors():
    pca_res = N.array([500,300,2])**2
    pca_res = 1/pca_res
    arr = N.identity(4)
    arr[0,0] = pca_res[0]
    arr[1,1] = pca_res[1]
    arr[2,2] = -pca_res[2]
    arr[3,3] = -1
    hyp = conic(arr)

    assert same(hyp.center(), vector(0,0,0))
    assert hyp.is_hyperbolic()

    # Plotting hyperbolic slice

    # Get hyperbolic slice on xz plane
    n = vector(0,1,0)
    p = plane(n)
    assert same(p.normal(),n)
    assert same(p.offset(),vector(0,0,0))

    n = p.normal()
    # Two vectors in plane
    # Perhaps need to add a case for when
    # plane is perpendicular to this vector
    v1 = N.cross(n,vector(0,1,0))
    if N.linalg.norm(v1) == 0:
        # we need to use another axis
        v1 = N.cross(n,vector(0,0,1))
    v2 = N.cross(v1,n)
    axes = (v1,v2)
    pt = p.offset()

    m = N.append(
        N.column_stack((axes[0],axes[1],pt)),
        N.array([[0,0,1]]),axis=0)

    h1 = hyp.transform(m)
    assert h1.is_hyperbolic()
    d = N.abs(N.diagonal(h1)[:-1])
    axes = N.sqrt(1/d)
    assert same(axes,N.array([500,2]))

    #y = lambda x: axes[1]*N.tan(N.arccos(axes[0]/x))
    u = lambda x: N.arcsinh(x/axes[0])
    y = lambda x: axes[1]*N.cosh(u(x))
    assert y(0) == axes[1]

