#-*- coding:utf-8 -*-

# https://en.wikipedia.org/wiki/Quadric

from __future__ import print_function, division

import numpy as N
from scipy.linalg import lu
import traceback
from numpy.linalg import norm

from attitude.geom.util import dot
from attitude.geom.vector import vector, augment, column, angle
from attitude.geom.conics import conic, Conic

same = N.allclose

def symmetric(arr):
    return (arr.transpose() == arr).all()

def skew_symmetric(arr):
    return (arr.transpose() == -arr).all()

def test_conic():
    # We consider a sphere with radius 1 offset 2 units on the X axis
    # the half-angle of its shadow will be sin(theta) = 1/2, or theta = 30º
    # Can we recreate this?
    origin = vector(0,0,0)

    r = 1
    offs = 2

    # Ellipsoid
    _ = N.identity(4)
    _[3,3] = -1
    ell0 = conic(_)

    # Center is inside origin
    assert ell0.contains(origin)

    # vector on the edge
    assert ell0.contains(vector(1,0,0))

    # Recovery of center?
    assert same(ell0.center(),origin)

    # Translate conic
    ell = ell0.translate(vector(2,0,0))

    assert same(ell.center(),[2,0,0])

    # Check that translation is reversible
    assert same(ell0, ell.translate(vector(-2,0,0)))

    assert symmetric(ell)

    assert ell.is_elliptical()

    ax = ell.major_axes()
    c = ell.center()
    for i in ax:
        v = c+i
        assert ell.contains(v,shell_only=True)

    # Plane of tangency
    # equation of plane polar to origin
    plane = ell.polar_plane(origin)

    # distance from tangent plane to origin
    hn = plane.hessian_normal()
    assert hn[3] == 1.5

    # pole of tangent plane?
    assert same(origin, ell.pole(plane))

    # center is inside ellipsoid
    assert ell.contains(ell.center())
    # origin is outside of ellipsoid
    assert not ell.contains(origin)

    assert ell.contains(vector(2,1,0))

    con, m, pt = ell.projection()

    assert same(con.center(),vector(0,0))

    # vector is on projected conic
    i = 1.5*N.tan(N.radians(30))
    v = augment(vector(i,0))
    assert same(con.solve(v), 0)

    ax = con.major_axes()
    # Computed axes are on conic
    for i in ax:
        assert con.contains(i, shell_only=True)

    # Rotate major axes into 3d space
    axs = N.append(ax,N.zeros((2,1)),axis=1)
    axs = dot(axs,m[:3].T)

    u = N.linspace(0,2*N.pi,1000)

    # Get a bundle of vectors defining cone
    # which circumscribes ellipsoid
    angles = N.array([N.cos(u),N.sin(u)]).T

    # Turn into vectors
    data = dot(angles,axs)+pt

    for d in data:
        _ = angle(d,vector(1,0,0))
        assert same(N.degrees(_),30)

    assert ell.dual().is_hyperbolic()

    # Cone of tangency
    # equation of elliptic cone
    B = N.sqrt(3)/2 # cos(30º)
    _ = N.diag([1.5,B,B,0])
    cone = conic(_)

    assert N.arctan(B/1.5) == N.radians(30)
    # Test that vector is on ellipse
    # Likely only works on ellipsoids

    assert same(cone.center(),origin)

def test_conic_axes():
    # Create ellipsoid
    ell = Conic.from_axes([500,200,100])
    assert ell.is_elliptical()
    assert not ell.dual().is_hyperbolic() # Degenerate case
    assert ell.translate(vector(0,0,1)).dual().is_hyperbolic()
