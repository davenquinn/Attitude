from __future__ import division

import numpy as N
from numpy.linalg import norm

from .util import dot

def vector(*args):
    """
    A single vector in any coordinate basis,
    as a numpy array.
    """
    return N.array(args)

def unit_vector(*args):
    v = vector(*args)
    return v/norm(v)

def augment(vec):
    """
    Augment a vector in any orthonormal basis
    with a trailing 1 to form a homogeneous
    coordinate vector in that coordinate system.
    """
    return N.append(vec,[1])

def unit_vector(vec):
    """
    Return a normalized version of the vector
    """
    return vec/N.linalg.norm(vec)

def column(vec):
    """
    Return a vector with a new trailing axis
    (of singular dimension) added.
    """
    return vec[:,N.newaxis]

def angle(v1,v2, cos=False):
    """
    Find the angle between two vectors.

    :param cos: If True, the cosine of the
    angle will be returned. False by default.
    """
    n = (norm(v1)*norm(v2))
    _ = dot(v1,v2)/n
    return _ if cos else N.arccos(_)

class Plane(N.ndarray):
    def hessian_normal(plane):
        """
        Return the Hessian Normal form of a plane
        (ax + by + cz + d = 0) where [a,b,c] forms
        the unit normal vector and d is the distance
        to the origin."""
        return plane/N.linalg.norm(plane[:3])

    def offset(plane):
        """
        Returns the offset of the plane from the
        origin or an arbitrary point.
        """
        v = plane.hessian_normal()
        return -N.array(v[:3]*v[3])

    def normal(plane):
        v = plane.hessian_normal()
        return v[:3]

def plane(normal,offset=0):
    # This only works in Hessian-Normal form
    return N.append(normal,offset).view(Plane)
