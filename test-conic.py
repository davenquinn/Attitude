#!/usr/bin/env python
#-*- coding:utf-8 -*-

import numpy as N

same = N.allclose

def dot(*matrices):
    return reduce(N.dot, matrices)

def center(conic):
    # (https://en.wikipedia.org/wiki/Matrix_representation_of_conic_sections#Center)
    ec = N.linalg.inv(conic[:3,:3])
    eo = conic[:3,3]
    return dot(ec,eo.T)

# We consider a sphere with radius 1 offset 2 units on the X axis
# the half-angle of its shadow will be sin(theta) = 1/2, or theta = 30º
# Can we recreate this?

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

# distance from origin to plane of tangency
d = 1.5

import IPython; IPython.embed()
