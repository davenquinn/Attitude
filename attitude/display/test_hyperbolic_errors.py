"""
Test module to make sure that simple representations of
hyperbolic errors are equivalent to more generalized
expressions.
"""
import numpy as N
from scipy.stats import chi2

from .plot.cov_types.regressions import as_hyperbola, hyperbola
from ..orientation.test_pca import random_pca
from ..geom import dot

def test_sampling_covariance():
    """
    Test the creation of hyperbolic errors
    along direction of maximum angular variability
    """
    fit = random_pca()

    sv = fit.singular_values

    covariance = sv**2/(len(fit.arr)-1)

    xvals = N.linspace(-100,100,100)
    n = len(fit.arr)
    level = N.sqrt(chi2.ppf(0.95,n-3))

    # Pick only direction of maximum angular error
    cov = covariance[1:]

    hyp = as_hyperbola(cov)
    d = N.abs(N.diagonal(hyp)[:-1])
    hyp_axes = N.sqrt(1/d)

    # Plot hyperbola
    b = N.sqrt(cov[-1])

    def y(x):
        return level*b*N.sqrt(x**2/(cov[0]*n)+1/n)

    # Top
    t = N.array([xvals,y(xvals)])
    # Btm
    b = N.array([xvals,-y(xvals)])
    res1 = (t[0],b[1],t[1])

    res2 = hyperbola(
        cov,
        N.identity(2), # rotation
        N.array([0,0]), # mean
        xvals,
        n=n,
        level=level)

    for a,b in zip(res1,res2):
        assert N.allclose(a,b)
