#!/usr/bin/env python
#-*- coding:utf-8 -*-

import numpy as N

same = N.allclose

def dot(*matrices):
    return reduce(N.dot, matrices)

def augment(vec):
    return N.append(vec,[1],axis=0)

def center(conic):
    # (https://en.wikipedia.org/wiki/Matrix_representation_of_conic_sections#Center)
    ec = N.linalg.inv(conic[:3,:3])
    eo = conic[:3,3]
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
    return dot(pole.T,ell)

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

# Plane of tangency
origin = N.array([0,0,0]).T
# equation of plane polar to origin
plane = polar(ell,origin)

# distance from tangent plane to origin
hn = hessian_normal(plane)
assert hn[3] == 1.5

# pole of tangent plane?
assert same(origin, pole(ell,plane))

import IPython; IPython.embed()
