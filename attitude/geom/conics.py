import numpy as N

from .util import dot
from .vector import augment, Plane

class Conic(N.ndarray):
    def center(conic):
        # (https://en.wikipedia.org/wiki/Matrix_representation_of_conic_sections#Center)
        ec = N.linalg.inv(conic[:-1,:-1])
        eo = -conic[:-1,-1]
        return dot(ec,eo.T)

    def contains(ell, p, shell_only=False):
        """
        Check to see whether point is inside
        conic.

        :param exact: Only solutions exactly on conic
          are considered (default: False).
        """
        v = augment(p)
        _ = ell.solve(v)
        return N.allclose(_,0) if shell_only else _ <= 0

    def major_axes(ell):
        """
        Gets major axes of ellipsoids
        """
        U,s,V = N.linalg.svd(ell[:-1,:-1])
        scalar = -(ell.sum()-ell[:-1,:-1].sum())
        return N.sqrt(s*scalar)*V

    def is_elliptical(ell):
        """
        Check that geometry is an ellipse,
        ellipsoid, or n-dimensional equivalent.
        """
        # Check that we have an ellipsoid
        return N.linalg.det(ell[:3,:3]) > 0

    def solve(conic,v):
        """
        Solves a conic for a particular vector.
        Similar to `Conic.transform`, but returns
        a regular array
        """
        return dot(v.T,conic,v)

    def transform(conic, T):
        """
        Transforms a conic or quadric by a transformation
        matrix.
        """
        return conic.solve(T).view(Conic)

    def translate(conic, vector):
        """
        Translates a conic by a vector
        """
        # Translation matrix
        T = N.identity(4)
        T[:3,3] = -vector
        return conic.transform(T)

    def polar_plane(conic, vector):
        """
        Calculates the polar plane to a vector (a 'pole')
        for a given conic section. For poles
        outside the conic, the polar plane
        contains all vectors of tangency to the pole.
        """
        pole = augment(vector)
        return dot(conic,pole).view(Plane)

    def pole(conic, plane):
        """
        Calculates the pole of a polar plane for
        a given conic section.
        """
        v = dot(N.linalg.inv(conic),plane)
        return v[:3]/v[3]

def conic(x):
    return N.array(x).view(Conic)

