from . import Regression
from ..tests import random_plane,scattered_plane
import numpy as N

def test_coordinates():
    """Tests coordinate length"""
    plane,coefficients = random_plane()
    fit = Regression(plane)
    assert N.column_stack(plane).shape[0] == fit.C.shape[0]

def test_regression():
    """Make sure we can fit a simple plane"""
    plane,coefficients = random_plane()
    fit = Regression(plane)
    assert N.allclose(fit.coefficients(), coefficients)

def test_covariance():
    """Make sure we don't get empty covariance matrices"""
    plane,coefficients = scattered_plane()
    fit = Regression(plane)
    for i in fit.covariance_matrix().flatten():
        assert i != 0
