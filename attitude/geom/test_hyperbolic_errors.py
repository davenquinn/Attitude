"""
Test module to make sure that simple representations of
hyperbolic errors are equivalent to more generalized
expressions.
"""
import numpy as N
from scipy.stats import chi2

from ..display.plot.cov_types.regressions import as_hyperbola, hyperbola
from ..orientation.test_pca import random_pca
from . import dot

def simple_hyperbola(cov, xvals, n=1, level=1):
    """
    Simple hyperbolic error bounds for 2d errors
    using quadratic formulation.

    Returns tuple of
        ( distance from center of distribution,
          width of error bar)
    in unrotated coordinate space
    """
    assert len(cov) == 2
    a = cov[0]
    # Plot hyperbola
    b = N.sqrt(cov[-1])

    def y(x):
        return level*b*N.sqrt(x**2/(a*n)+1/n)

    # Top values of error bar only
    t = N.array([xvals,y(xvals)])
    return t

# Create a basic fit to test against
# (we could probably speed this up)
fit = random_pca()

sv = fit.singular_values
n = len(fit.arr)

covariance = sv**2/(n-1)

xvals = N.linspace(-100,100,100)
level = N.sqrt(chi2.ppf(0.95,n-3))

def test_sampling_covariance():
    """
    Test the creation of hyperbolic errors
    along direction of maximum angular variability
    """
    # use only direction of maximum angular
    # variation
    cov = covariance[1:]

    res1 = simple_hyperbola(cov,xvals, n, level)
    res2 = hyperbola(
        cov,
        N.identity(2), # rotation
        N.array([0,0]), # mean
        xvals,
        n=n,
        level=level)

    # In axis-aligned frame, magnitude of top and bottom
    # of error bars should be the same
    assert N.allclose(
        N.abs(res2[1]),
        res2[2])
    # Get only top values (bottom will be the same
    # implicitly)
    res2 = (res2[0],res2[-1])

    for a,b in zip(res1,res2):
        assert N.allclose(a,b)

def test_hyperbolic_simple():
    """
    Convert to hyperbolic axes before projection into
    plane of maximum angular variability
    """
    pass


def test_hyperbolic_projection():
    """
    Test fully projective mechanisms to get hyperbolic error
    bounds in a generalized way along any axes associated with
    the plane.
    """
    pass
