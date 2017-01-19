"""
Functions for converting fit parameters into covariance
and hyperbolic axes. These all operate in axis-aligned
space---rotation into global coordinate systems should
occur after these transformations are applied.
"""
from __future__ import division
import numpy as N
from scipy.stats import chi2, f

def sampling_covariance(fit):
    """
    Naive covariance for each axis, taking into account number of samples

    The factor of two originates from (Faber, 1993), but I am not sure where
    it arises from statistically. Including it increases correspondence with
    noise covariance results.
    """
    sv = fit.singular_values
    return 2*sv**2/(fit.n-1)

def sampling_covariance(fit):
    ev = fit.eigenvalues
    return N.sqrt(2*ev**2/(fit.n-1))

def noise_covariance(fit, dof=2):
    """
    Covariance taking into account the 'noise covariance' of the data.
    This is technically more realistic for continuously sampled data.
    From Faber, 1993
    """
    ev = fit.eigenvalues
    return N.sqrt(4*ev*ev[2]/(fit.n-dof))

def apply_error_level(cov, level):
    """
    Adds sigma level to covariance matrix
    """
    cov[-1]*=level
    return cov

def sampling_axes(fit, confidence_level=0.95, dof=2):
    """
    Hyperbolic axis lengths based on sample-size
    normal statistics

    Integrates covariance with error level
    and degrees of freedom for plotting
    confidence intervals.

    Degrees of freedom is set to two, which is the
    relevant number of independent dimensions to planar-fit
    data.
    """
    cov = sampling_covariance(fit)
    sigma = chi2.ppf(confidence_level,fit.n-dof)/fit.n
    return apply_error_level(cov,sigma)

def noise_axes(fit, confidence_level=0.95, dof=2):
    cov = noise_covariance(fit)
    sigma = chi2.ppf(confidence_level,dof)
    return apply_error_level(cov, sigma)

def __angular_error(hyp_axes, axis_length):
    """
    The angular error for an in-plane axis of
    given length (either a PCA major axis or
    an intermediate direction).
    """
    return N.arctan2(hyp_axes[-1],axis_length)

def angular_errors(hyp_axes):
    """
    Minimum and maximum angular errors
    corresponding to 1st and 2nd axes
    of PCA distribution.
    """
    return tuple(__angular_error(hyp_axes, i)
            for i in hyp_axes[:-1])

### Sampling axes from Jolliffe, 1980 v2 pp50-52

def jolliffe_axes(fit, confidence_level=0.95, dof=2):
    n = fit.n
    lam = fit.eigenvalues
    z = chi2.ppf(confidence_level, n-dof)
    tau = N.sqrt(2/(n-1))
    return lam/N.sqrt(1+tau*z)

def francq_axes(fit, confidence_level=0.95):
    n = fit.n
    s = fit.singular_values
    h = s/N.sqrt(n)
    # Use f statistic instead of chi2 (ratio of two chi2 variables)
    F = f.ppf(confidence_level, 2, n-2)
    h[-1] *= N.sqrt(2*F/(n-2))
    return h
