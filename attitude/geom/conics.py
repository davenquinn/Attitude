import numpy as N

from .util import dot
from .vector import vector, augment, Plane, angle

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

    def projection(self, **kwargs):
        """
        The elliptical cut of an ellipsoidal
        conic describing all points of tangency
        to the conic as viewed from the origin.
        """
        v = kwargs.pop('viewpoint',vector(0,0,0))
        plane = self.polar_plane(v)

        if not kwargs.pop('axes',None):
            n = plane.normal()
            # Two vectors in plane
            # Perhaps need to add a case for when
            # plane is perpendicular to this vector
            v1 = N.cross(n,[0,1,0])
            v2 = N.cross(v1,n)
            axes = (v1,v2)
        pt = plane.offset()

        m = N.append(
            N.column_stack((axes[0],axes[1],pt)),
            N.array([[0,0,1]]),axis=0)

        return self.transform(m), m, pt

    def maximum_angle(self):
        conic, T, center = self.projection()
        ax = conic.major_axes()

        # Rotate into 3d space
        _ = N.zeros((2,1))
        ax = N.append(ax,_,axis=1)
        ax = dot(ax,m[:3].T)

        v = ax[0]+pt
        return angle(v,pt)




def conic(x):
    return N.array(x).view(Conic)

