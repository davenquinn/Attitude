from __future__ import division

import numpy as N

from .util import dot
from .vector import vector, augment, Plane, angle

class Conic(N.ndarray):
    @classmethod
    def from_axes(cls,axes):
        """
        Get axis-aligned elliptical conic from axis lenths
        This can be converted into a hyperbola by getting the dual conic
        """
        ax = list(axes)
        #ax[-1] *= -1  # Not sure what is going on here...
        arr = N.diag(ax + [-1])
        return arr.view(cls)

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

    def hyperbolic_axes(self):
        d = N.abs(N.diagonal(self)[:-1])
        return 1/d

    def major_axes(ell):
        """
        Gets major axes of ellipsoids
        """
        _ = ell[:-1,:-1]
        U,s,V = N.linalg.svd(_)
        scalar = -(ell.sum()-_.sum())
        return N.sqrt(s*scalar)*V

    def __type(self):
        return N.linalg.det(self[:-1,:-1])

    def is_elliptical(self):
        """
        Check that geometry is an ellipse,
        ellipsoid, or n-dimensional equivalent.
        """
        return self.__type() > 0

    def is_hyperbolic(self):
        return self.__type() < 0

    def is_parabolic(self):
        return self.__type() == 0

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
        T = N.identity(len(conic))
        T[:-1,-1] = -vector
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

    def slice(self, plane, **kwargs):
        axes = kwargs.pop('axes',None)
        if axes is None:
            n = plane.normal()
            # Two vectors in plane
            v1 = N.cross(n,vector(0,1,0))
            if N.linalg.norm(v1) == 0:
                # we need to use another axis
                v1 = N.cross(n,vector(0,0,1))
            v2 = N.cross(v1,n)
            axes = (v1,v2)
        pt = plane.offset()

        m = N.append(
            N.column_stack((axes[0],axes[1],pt)),
            N.array([[0,0,1]]),axis=0)

        # This isn't an ideal return signature
        # but it's what we're working with now
        return self.transform(m), m, pt

    def projection(self, **kwargs):
        """
        The elliptical cut of an ellipsoidal
        conic describing all points of tangency
        to the conic as viewed from the origin.
        """
        v = kwargs.pop('viewpoint',vector(0,0,0))
        plane = self.polar_plane(v)
        return self.slice(plane, **kwargs)

    def maximum_angle(self):
        conic, T, center = self.projection()
        ax = conic.major_axes()

        # Rotate into 3d space
        _ = N.zeros((2,1))
        ax = N.append(ax,_,axis=1)
        ax = dot(ax,m[:3].T)

        v = ax[0]+center
        return angle(v,center)

    def dual(self):
        """
        The inverse conic that represents the bundle
        of lines tangent to this conic.

        Conics and their duals, p 159
        """
        return N.linalg.inv(self)

def conic(x):
    return N.array(x).view(Conic)

