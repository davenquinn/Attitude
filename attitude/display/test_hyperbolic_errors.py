"""
Test module to make sure that simple representations of
hyperbolic errors are equivalent to more generalized
expressions.
"""
import numpy as N
from scipy.stats import chi2

from .plot.cov_types.regressions import hyperbola
from ..orientation.test_pca import random_pca
from ..geom import dot

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

def hyperbola_from_axes(cov, xvals, n=1, level=1):
    # Plot hyperbola
    cov[-1] = level*N.sqrt(cov[-1]/n)

    def y(x):
        return cov[-1]*N.sqrt(x**2/cov[1]+1)

    # Top values of error bar only
    t = N.array([xvals,y(xvals)])
    return t

def test_sampling_covariance():
    """
    Test the creation of hyperbolic errors
    along direction of maximum angular variability
    """
    fit = random_pca()

    sv = fit.singular_values
    n = len(fit.arr)

    cov = sv**2/(n-1)

    xvals = N.linspace(-100,100,100)
    level = chi2.ppf(0.95,n-3)

    # use only direction of maximum angular
    # variation
    cov2d = cov[1:]

    res1 = simple_hyperbola(cov2d,xvals, n, N.sqrt(level))
    res2 = hyperbola(
        cov2d,
        N.identity(2), # rotation
        N.array([0,0]), # mean
        xvals,
        n=n,
        level=N.sqrt(level))
    # Get only top values
    res2 = (res2[0],res2[-1])

    for a,b in zip(res1,res2):
        assert N.allclose(a,b)

    # Scale axes before sending to plotting function
    cov[-1] = level*cov[-1]/n
    res3 = simple_hyperbola(cov[1:],xvals)
    for a,b in zip(res1,res3):
        assert N.allclose(a,b)

def test_noise_covariance():
    fit = random_pca()

