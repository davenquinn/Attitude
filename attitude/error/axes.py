"""
Functions for converting fit parameters into covariance
and hyperbolic axes. These all operate in axis-aligned
space---rotation into global coordinate systems should
occur after these transformations are applied.
"""
from scipy.stats import chi2

def sampling_covariance(fit):
    sv = fit.singular_values
    # naive covariance for each axis, taking into account number of samples
    return sv**2/(fit.n-1)

def apply_error_level(cov, level):
    """
    Adds sigma level to covariance matrix
    """
    cov[-1]*=level
    return cov

def sampling_axes(fit, confidence_level=0.95):
    """
    Hyperbolic axis lengths based on sample-size
    normal statistics

    Integrates covariance with error level
    and degrees of freedom for plotting
    confidence intervals.
    """
    cov = sampling_covariance(fit)
    sigma = chi2.ppf(confidence_level,fit.n-3)/fit.n
    return apply_error_level(cov,sigma)

