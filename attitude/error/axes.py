"""
Functions for converting fit parameters into covariance
and hyperbolic axes. These all operate in axis-aligned
space---rotation into global coordinate systems should
occur after these transformations are applied.
"""
from __future__ import division
import numpy as N
from scipy.stats import chi2, f, norm
from ..orientation.linear import Regression
from ..geom import dot

def mean_estimator(data_variance, n):
    """
    Get the variance of the mean from a data variance term
    (e.g. an eigenvalue) and return an estimator of the precision of the mean
    """
    return data_variance/n**2

# We aren't going to apply this for now, which means that we
# are using the estimator for variance on all axes.
mean_on_error_axis = False

def sampling_covariance(fit, **kw):
    # This is asserted in both Faber and Jolliffe, although the
    # former expression is ambiguous due to a weirdly-typeset radical
    ev = fit.eigenvalues
    cov = 2/(fit.n-1)*ev**2
    ### Don't know if the below is a good idea ###
    if mean_on_error_axis:# and not kw.get('variance_on_all_axes',False):
        # Try applying estimator of mean to the sample distribution
        # This is the variance of the mean, not the variance of axial lengths
        # Not sure if this is the right framework
        # Moving from a second-order to first-order estimator
        cov[-1] += mean_estimator(ev[-1],fit.n)
    return cov

def noise_covariance(fit, dof=2, **kw):
    """
    Covariance taking into account the 'noise covariance' of the data.
    This is technically more realistic for continuously sampled data.
    From Faber, 1993
    """
    ev = fit.eigenvalues

    measurement_noise = ev[-1]/(fit.n-dof)
    cov = 4*ev*measurement_noise
    if mean_on_error_axis and not kw.get('variance_on_all_axes',False):
        # Try applying estimator of mean to the sample distribution
        # This is the variance of the mean, not the variance of axial lengths
        # Not sure if this is the right framework
        # Moving from a second-order to first-order estimator
        cov[-1] = mean_estimator(ev[-1],fit.n)
    return cov

def apply_error_level(cov, level):
    """
    Adds sigma level to covariance matrix
    """
    cov[-1]*=level
    return cov

def apply_error_scaling_old(nominal,errors, **kw):
    """
    This method does not account for errors on the
    in-plane axes
    """
    try:
        nominal[-1] = errors[-1]
    except IndexError:
        # We're dealing with a scalar
        nominal[-1] = errors
    return nominal

def apply_error_scaling(nominal,errors, variance_on_all_axes=True):
    if variance_on_all_axes:
        # We apply variance to error axis as well, making a more
        # explicit dependence on the scale of the errors to the
        # plane. This reduces the effects of statistical scaling,
        # sometimes to the point of irrelevance.
        nominal[-1] *= -1
        #pass
    else:
        nominal[-1] = 0
    nominal -= errors
    return N.abs(nominal)

def eigenvalue_axes(fit,**kw):
    return fit.eigenvalues

def sampling_axes(fit, confidence_level=0.95, dof=2, **kw):
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
    sigma = chi2.ppf(confidence_level,dof)
    e = fit.eigenvalues
    # Apply error scaling to standard errors, not covariance
    return apply_error_scaling(e, N.sqrt(cov)*sigma)

def noise_axes(fit, confidence_level=0.95, dof=2, **kw):
    cov = noise_covariance(fit)
    # Not sure if this needs to be a root or not
    sigma = chi2.ppf(confidence_level,dof)
    #sigma = fisher_statistic(fit.n, confidence_level)#/(fit.n-dof)
    e = fit.eigenvalues
    return apply_error_scaling(e, sigma*N.sqrt(cov), **kw)

def axis_angular_error(hyp_axes, axis_length):
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

    Ordered as [minimum, maximum] angular error.
    """
    ax = N.sqrt(hyp_axes)
    return tuple(N.arctan2(ax[-1],ax[:-1]))

### Sampling axes from Jolliffe, 1980 v2 pp50-52

def jolliffe_axes(fit, confidence_level=0.95, dof=2,**kw):
    n = fit.n
    e = fit.eigenvalues
    l = e*(n-1)/n # This is correct to first order

    # z a/2 is the "upper 100*a/2 percentile of the standard normal
    # distribution, which probably means
    level = (1-confidence_level)/2
    z = norm.pdf(level)
    # or could it be
    z = norm.ppf(confidence_level/2)
    tau = N.sqrt(2/(n-1))
    scalar = tau*z
    # Lower confidence bound
    lc = l/N.sqrt(1+scalar)

    return N.array([
        lc[0],
        lc[1], # Lower error bound for first two axes
        e[2]-lc[2] # Only the error
    ])

def fisher_statistic(n, confidence_level, dof=2):
    #a = 1-confidence_level
    # not sure if dof should be two or 3
    df = (dof,n-dof) # Degrees of freedom
    return f.ppf(confidence_level, *df)
## Maybe we should use Bingham distribution instead

def sampling_axes_fisher(fit, confidence_level=0.95, **kw):
    """
    Sampling axes using a fisher statistic instead of chi2
    """
    dof = kw.pop('dof',3)
    sigma = N.sqrt(sampling_covariance(fit,**kw))
    z = fisher_statistic(fit.n,confidence_level,dof=dof)
    e = fit.eigenvalues
    # Apply error scaling to standard errors, not covariance
    return apply_error_scaling(e, z*sigma, **kw)

def sampling_axes_fisher(fit, confidence_level=0.95, **kw):
    """
    Sampling axes using a fisher statistic instead of chi2
    And with a treatment of beta instead of old
    """
    # From @Fahrmeir2013 instead of old way
    # The math is sound but not the endpoint, I think.
    dof = kw.pop('dof',3)
    cov = sampling_covariance(fit,**kw)
    z = fisher_statistic(fit.n,confidence_level,dof=dof)
    # e = fit.eigenvalues
    # Use definition of beta
    l = fit.eigenvalues
    #beta = -l/l[-1] # Plane parameters

    # errors to plane parameters
    # from propagation of division
    #err = N.abs(beta)*N.sqrt(cov/l+cov[-1]/l[-1])
    #err *= N.sqrt(2*z)

    # Apply two fisher F parameters
    # Since we apply to each axis without division,
    # it is as if we are applying N.sqrt(2*F) to the entire
    # distribution, aligning us with fisher
    err = z*N.sqrt(cov)

    # Apply error scaling to standard errors, not covariance
    return apply_error_scaling(l, err, **kw)

def noise_axes_fisher(fit, confidence_level=0.95, **kw):
    """
    Sampling axes using a fisher statistic instead of chi2
    """
    sigma = N.sqrt(noise_covariance(fit,**kw))
    # Not sure if extra factor of two is necessary (increases
    # correspondence with
    dof = kw.pop('dof',3)
    z = fisher_statistic(fit.n,confidence_level,dof=dof)
    e = fit.eigenvalues
    # Apply error scaling to standard errors, not covariance
    return apply_error_scaling(e, z*sigma, **kw)

sampling_axes = sampling_axes_fisher
noise_axes = noise_axes_fisher

def francq_axes(fit, confidence_level=0.95, **kw):
    n = fit.n
    s = fit.singular_values
    e = fit.eigenvalues
    # Use f statistic instead of chi2 (ratio of two chi2 variables)
    # Significance level $\alpha = 0.05$ (e.g.)
    F = fisher_statistic(n, confidence_level)

    # This factor is common between Francq and Babamoradi
    factor = 2*F/(n-2)
    # Not sure if we should take sqrt of Fisher distribution
    h = e*N.sqrt(factor)
    return apply_error_scaling(e,h, **kw)

def babamoradi_axes(fit, confidence_level=0.95, **kw):
    e = fit.eigenvalues
    n = fit.n
    F = fisher_statistic(n, confidence_level)
    val = 2*F/(n-2)
    H = N.sqrt(e*val*(n**2-1)/n)
    #H[-1] -= e[-1]
    # Not sure why this done have worked but it do
    return H**2# apply_error_scaling(e,H, **kw)

def weingarten_axes(fit, confidence_level=0.95):
    """
    This is basically meaningless in its current form
    """
    e = fit.eigenvalues
    reg = Regression(fit.rotated())

    c = N.abs(reg.coefficients)
    c = c[-1]/c*e[-1]
    c = c/c[-1]*e[-1]
    # rise over run
    return apply_error_scaling(e,c)

def regression_axes(fit, confidence_level=0.95, **kw):
    # For now we are ignoring slight rotation from PCA errors
    arr = fit.rotated()
    X = N.ones_like(arr)
    X[:,:2] = arr[:,:2]

    y = arr[:,2]

    inv = N.linalg.inv(dot(X.T,X))

    # Orthogonalize the design matrix
    # using the Gram-Schmidt transformation
    # (from p 112 of Fahrimer et al., Regression statistics)
    B_hat = dot(inv,X.T,y)

    yhat = dot(X,B_hat)
    mse = ((y-yhat)**2).mean()
    # We could find axes here
    VarB = N.diag(dot(mse,inv))
    dof = 2
    sigma = chi2.ppf(confidence_level,dof)

    # We go off the rails at this point
    h = sigma*N.sqrt(VarB)
    a = 1/h
    a[-1] = h[-1]**2
    return a

def variance_axes(fit):
    return fit.eigenvalues
