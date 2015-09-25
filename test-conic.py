#!/usr/bin/env python
#-*- coding:utf-8 -*-

# https://en.wikipedia.org/wiki/Quadric

from __future__ import print_function, division

import numpy as N
from scipy.linalg import lu
from IPython import embed
import traceback
from numpy.linalg import norm

from attitude.geom.util import dot
from attitude.geom.vector import vector, augment, column, angle

same = N.allclose

def symmetric(arr):
    return (arr.transpose() == arr).all()

def skew_symmetric(arr):
    return (arr.transpose() == -arr).all()

def on(ell,p):
    v = augment(p)
    _ = transform(ell,v)
    return same(_,0)

def inside(ell,p):
    # Likely only works on ellipsoids
    v = augment(p)
    return transform(ell,v) <= 0

def center(conic):
    # (https://en.wikipedia.org/wiki/Matrix_representation_of_conic_sections#Center)
    ec = N.linalg.inv(conic[:-1,:-1])
    eo = -conic[:-1,-1]
    return dot(ec,eo.T)

def major_axes(ell):
    # Get ellipse axes
    U,s,V = N.linalg.svd(ell[:-1,:-1])
    scalar = -(ell.sum()-ell[:-1,:-1].sum())
    return N.sqrt(s*scalar)*V

def hessian_normal(plane):
    """
    Return the Hessian Normal form of a plane
    (ax + by + cz + d = 0) where [a,b,c] forms
    the unit normal vector and d is the distance
    to the origin."""
    return plane/N.linalg.norm(plane[:3])

def polar(conic, vector):
    """
    Calculates the polar plane to a vector (a 'pole')
    for a given conic section. For poles
    outside the conic, the polar plane
    contains all vectors of tangency to the pole.
    """
    pole = augment(vector)
    return dot(ell,pole)

def transform(conic, T):
    """
    Transforms a conic or quadric by a transformation
    matrix.
    """
    return dot(T.T,conic,T)

def translate(conic, vector):
    """
    Translates a conic by a vector
    """
    # Translation matrix
    T = N.identity(4)
    T[:3,3] = -vector
    return transform(conic,T)

def pole(conic, plane):
    """
    Calculates the pole of a polar plane for
    a given conic section.
    """
    v = dot(N.linalg.inv(conic),plane)
    return v[:3]/v[3]

def is_ellipsoid(ell):
    # Check that we have an ellipsoid
    return N.linalg.det(ell[:3,:3]) > 0

try:
    # We consider a sphere with radius 1 offset 2 units on the X axis
    # the half-angle of its shadow will be sin(theta) = 1/2, or theta = 30º
    # Can we recreate this?
    origin = vector(0,0,0)

    r = 1
    offs = 2

    # Ellipsoid
    ell0 = N.identity(4)
    ell0[3,3] = -1

    # Center is inside origin
    assert inside(ell0,origin)

    # vector on the edge
    assert inside(ell0,vector(1,0,0))

    # Recovery of center?
    assert same(center(ell0),origin)

    # Translate conic
    ell = translate(ell0,N.array([2,0,0]))

    assert same(center(ell),[2,0,0])

    # Check that translation is reversible
    assert same(ell0, translate(ell,N.array([-2,0,0])))

    assert symmetric(ell)

    assert is_ellipsoid(ell)

    ax = major_axes(ell)
    c = center(ell)
    for i in ax:
        v = c+i
        assert on(ell,v)

    # Plane of tangency
    # equation of plane polar to origin
    plane = polar(ell,origin)

    # distance from tangent plane to origin
    hn = hessian_normal(plane)
    assert hn[3] == 1.5

    # pole of tangent plane?
    assert same(origin, pole(ell,plane))

    # center is inside ellipsoid
    assert inside(ell,center(ell))
    # origin is outside of ellipsoid
    assert not inside(ell,origin)

    assert inside(ell,vector(2,1,0))

    n = hn[:3]
    # vector in plane
    pt = hn[3]*n
    # Get two vectors in plane
    v1 = N.cross(n,[0,1,0])
    v2 = N.cross(v1,n)

    # transformation matrix
    v1 = vector(0,1,0)
    v2 = vector(0,0,1)
    pt = vector(1.5,0,0)

    m = N.column_stack((v1,v2,pt))
    m = N.append(m,N.array([[0,0,1]]),axis=0)

    con = transform(ell,m)

    assert same(center(con),vector(0,0))

    # vector is on projected conic
    i = 1.5*N.tan(N.radians(30))
    v = augment(vector(i,0))
    assert same(transform(con,v), 0)

    ax = major_axes(con)
    # Computed axes are on conic
    for i in ax:
        assert on(con,i)

    # Rotate major axes into 3d space
    a,b = ax.shape
    axs = N.zeros((a,b+1))
    axs[:a,:b] = ax
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

    # Cone of tangency
    # equation of elliptic cone
    B = N.sqrt(3)/2 # cos(30º)
    cone = N.diag([-1.5,B,B,0])

    assert N.arctan(B/1.5) == N.radians(30)
    # Test that vector is on ellipse
    # Likely only works on ellipsoids


    assert same(center(cone),origin)

    print("No errors")
    embed()

except AssertionError as err:
    tb = traceback.format_exc()
    print(tb)
    embed()

