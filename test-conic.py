#!/usr/bin/env python
#-*- coding:utf-8 -*-

# https://en.wikipedia.org/wiki/Quadric

import numpy as N
from scipy.linalg import lu
from IPython import embed

same = N.allclose

def dot(*matrices):
    return reduce(N.dot, matrices)

def augment(vec):
    """
    Augment a vector or square matrix
    """
    s = vec.shape
    sz = list(s)
    sz[0] += 1
    if N.squeeze(vec).ndim == 1:
        _ = N.ones(sz)
        _[:-1] = vec
    else:
        s = vec.shape
        _ = N.identity(sz[0])
        _[:s[0],:s[1]] = vec
    return _


def point(*args):
    assert len(args) < 4
    return N.array(args)

def column(vector):
    return vector[:,N.newaxis]

def inside(ell,p):
    # Likely only works on ellipsoids
    v = augment(p)
    _ = dot(v.T,ell,v)
    print _
    return _ >= 0

def center(conic):
    # (https://en.wikipedia.org/wiki/Matrix_representation_of_conic_sections#Center)
    ec = N.linalg.inv(conic[:-1,:-1])
    eo = conic[:-1,-1]
    return dot(ec,eo.T)

def hessian_normal(plane):
    """
    Return the Hessian Normal form of a plane
    (ax + by + cz + d = 0) where [a,b,c] forms
    the unit normal vector and d is the distance
    to the origin."""
    return plane/N.linalg.norm(plane[:3])

def polar(conic, point):
    """
    Calculates the polar plane to a point (a 'pole')
    for a given conic section. For poles
    outside the conic, the polar plane
    contains all points of tangency to the pole.
    """
    pole = augment(origin)
    return dot(ell,pole)

def pole(conic, plane):
    """
    Calculates the pole of a polar plane for
    a given conic section.
    """
    v = dot(N.linalg.inv(conic),plane)
    return v[:3]/v[3]

# We consider a sphere with radius 1 offset 2 units on the X axis
# the half-angle of its shadow will be sin(theta) = 1/2, or theta = 30º
# Can we recreate this?

r = 1
offs = 2

# Ellipsoid
ell0 = N.identity(4)
ell0[3,3] = -1

assert same(center(ell0),[0,0,0])

# Translation matrix
T = N.identity(4)
T[0,3] = 2
ell = dot(T.T,ell0,T)

assert same(center(ell),[2,0,0])

# Check that translation is reversible
T[0,3] = -2
assert same(ell0, dot(T.T,ell,T))

# Check that we have an ellipsoid
assert N.linalg.det(ell[:3,:3]) > 0

# Plane of tangency
origin = point(0,0,0)
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

n = hn[:3]
# point in plane
pt = hn[3]*n
# Get two vectors in plane
v1 = N.cross(n,[0,1,0])
v2 = N.cross(v1,n)


# plane can be represented
#1x3 3x4
# a v1 + b v2 + x_0 = x
#a v1 + b v2 = x_c
# [a b 1] [v1 v2 x0] = x
# 4x3 3x1
# a p = x
# a = p^-1 x

# transformation matrix
m = N.column_stack((v1,v2,pt))
m = N.append(m,N.array([[0,0,1]]),axis=0)

con = dot(m.T, ell, m)

# |a|
# |b| [ d e f ] = ad + be + cf
# |c|

#e = dot(p.T,ell,p)
#from scipy.linalg import lu
#L,U = lu(e,permute_l=True)

offs = N.array([0,0,1])

# X^T L = 0


# X^T L = 0
# U X = 0

# T^T m^T L = 0
# U m T = 0e

# Cone of tangency
# equation of elliptic cone
B = N.sqrt(3)/2 # cos(30º)
cone = N.diag([-1.5,B,B,0])

assert N.arctan(B/1.5) == N.radians(30)

assert same(center(cone),origin)

import IPython; IPython.embed()
