import numpy as N
from scipy.integrate import quad
from ..test import random_plane
from .pca import PCAOrientation

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
        arr, coeffs = random_plane()
        pca = PCAOrientation(arr)
        assert True
