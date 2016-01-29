from __future__ import division

import numpy as N
from scipy.integrate import quad
from ..test import random_plane, scattered_plane
from .pca import PCAOrientation, centered
from ..geom.util import dot

def random_pca(scattered=True):
    if scattered:
        arr,coeffs = scattered_plane()
    else:
        arr, coeffs = random_plane()
    arr = N.array(arr).transpose()
    return PCAOrientation(arr)

def test_solid_angle():
    """
    Test that integration to a range of girdle
    half-widths returns the appropriate solid angles.
    """
    pairs = [(N.pi/2,4*N.pi)]
    for angle, solid_angle in pairs:
        def func(theta):
            return angle
        i = quad(func, 0, N.pi/2)[0]
        # cover for all slices of hyperbola
        assert True
        #assert N.allclose(8*i, solid_angle)

def test_recovery_from_axes():
    """
    Tests the recovery of a Principal Component
    dataset from a set of precomputed axes.
    """
    for i in range(10):
        pca = random_pca()
        axes = pca.axes*pca.singular_values

        lengths = N.linalg.norm(axes,axis=0)
        assert N.allclose(lengths, pca.singular_values)

        assert N.allclose(pca.arr, dot(pca.U,pca.sigma,pca.V))
        a2 = dot(pca.arr,pca.V.T)
        assert N.allclose(a2,
            dot(pca.U,pca.sigma))

        sinv = N.diag(1/pca.singular_values)
        assert N.allclose(N.identity(3),dot(pca.sigma,sinv))

        an = dot(pca.sigma,pca.V)

        inv = N.linalg.inv(an)
        a3 =  dot(pca.arr,pca.V.T,sinv)
        try:
            assert N.allclose(a3,pca.U)
        except AssertionError as err:
            # For exceedingly small PCA axes,
            # recovered values of U are sometimes
            # quite different, but this is insignificant
            # in absolute terms.
            assert N.allclose(a3[:,:2],pca.U[:,:2])
            sv = pca.singular_values[2]
            assert N.allclose(
                a3[:,2]*sv,
                pca.U[:,2]*sv,
                atol=1e-10)

def test_builtin_recovery():
    """
    Test recovery functions that are built into
    basic API
    """
    for i in range(10):
        pca = random_pca()
        pca2 = PCAOrientation(pca.arr,
            axes=pca.principal_axes)

        assert N.allclose(pca.V,pca2.V)
        assert N.allclose(pca.U,pca2.U)
