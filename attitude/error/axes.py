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

def mean_estimator(data_variance, n, ddof=1):
    """
    Get the variance of the mean from a data variance term (e.g. an eigenvalue)
    and return an estimator of the precision of the mean (e.g. the variance of
    the mean itself.)

    Note: this is not used in the actual calculation of PCA planar
    fitting errors; it is present for testing purposes.
    """
    return data_variance/(n-ddof)

def sampling_covariance(fit, **kw):
    # This is asserted in both Faber and Jolliffe, although the
    # former expression is ambiguous due to a weirdly-typeset radical
    ev = fit.eigenvalues
    cov = 2/(fit.n-1)*ev**2
    return cov

def noise_covariance(fit, dof=2, **kw):
    """
    Covariance taking into account the 'noise covariance' of the data.
    This is technically more realistic for continuously sampled data.
    From Faber, 1993
    """
    ev = fit.eigenvalues

    measurement_noise = ev[-1]/(fit.n-dof)
    return 4*ev*measurement_noise

def apply_error_scaling(nominal,errors, n, variance_on_all_axes=True):
    if not variance_on_all_axes:
        # We do not apply variance to error axis as well, making a more
        # explicit dependence on the scale of the errors to the
        # plane. This reduces the effects of statistical scaling,
        # sometimes to the point of irrelevance.
        nominal[-1] /= (n-1)

    # Apply errors inwards on xy plane and outwards on z axis
    nominal[-1] *= -1
    nominal -= errors
    return N.abs(nominal)

def eigenvalue_axes(fit,**kw):
    # The simple 'data variance' method.
    return fit.eigenvalues

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
    # Not quite sure why this is sqrt but it is empirically correct
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

def statistical_axes(fit, **kw):
    """
    Hyperbolic error using a statistical process (either sampling or noise errors)

    Integrates covariance with error level
    and degrees of freedom for plotting
    confidence intervals.

    Degrees of freedom is set to 2, which is the
    relevant number of independent dimensions
    to planar fitting of *a priori* centered data.
    """
    method = kw.pop('method', 'noise')
    confidence_level = kw.pop('confidence_level', 0.95)
    dof = kw.pop('dof',2)

    nominal = fit.eigenvalues

    if method == 'sampling':
        cov = sampling_covariance(fit,**kw)
    elif method == 'noise':
        cov = noise_covariance(fit,**kw)

    if kw.pop('chisq', False):
        # Model the incorrect behaviour of using the
        # Chi2 distribution instead of the Fisher
        # distribution (which is a measure of the
        # ratio between the two).
        z = chi2.ppf(confidence_level,dof)
    else:
        z = fisher_statistic(fit.n,confidence_level,dof=dof)

    if kw.pop('error_scaling_inside',False):
        # If we want to model (likely incorrect) behavior of
        # applying scaling by data variance **before**
        # the application of a statistical distribution
        err = z*N.sqrt(cov)
        if kw.pop('variance_on_all_axes', True):
            # Scale covariance by the data variance in the
            # out-of-plane direction.
            # The variance **itself** is the standard error
            # on the population "true value"
            err[-1] += chi2.ppf(confidence_level, dof)*N.sqrt(fit.eigenvalues[-1])
        err[:-1] *= -1
        nominal[-1] = 0
        nominal += err
        return N.abs(nominal)

    # Apply two fisher F parameters (one along each axis)
    # Since we apply to each axis without division,
    # it is as if we are applying N.sqrt(2*F) to the entire
    # distribution, aligning us with (Francq, 2014)
    err = z*N.sqrt(cov)
    return apply_error_scaling(nominal, err, n=fit.n, **kw)



def sampling_axes(fit, **kw):
    """
    Hyperbolic axis lengths based on sample-size
    normal statistics
    """
    return statistical_axes(fit, method='sampling', **kw)

def noise_axes(fit, **kw):
    return statistical_axes(fit, method='noise', **kw)

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
    return apply_error_scaling(e,h, n=n, **kw)

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
    return apply_error_scaling(e,c, n=fit.n)

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

def hyperbolic_axes(fit, **kwargs):
    type = kwargs.pop('type', 'noise')
    try:
        if type == 'noise':
            return noise_axes(fit, **kwargs)
        else:
            return sampling_axes(fit, **kwargs)
    except:
        return fit.hyperbolic_axes

def variance_axes(fit):
    return fit.eigenvalues
