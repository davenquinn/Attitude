import numpy as N
from .geom.util import dot

def ellipse(axes, n=1000):
    """
    Get a parameterized set of vectors defining
    ellipse for a major and minor axis length.
    Resulting vector bundle has major axes
    along axes given.
    """
    u = N.linspace(0,2*N.pi,n)
    # Get a bundle of vectors defining
    # a full rotation around the unit circle
    angles = N.array([N.cos(u),N.sin(u)]).T
    return dot(angles,axes)

def plane_errors(axes, covariance_matrix, sheet='upper',**kwargs):
    level = kwargs.pop('level',1)

    from mplstereonet.stereonet_math import cart2sph
    d = N.sqrt(covariance_matrix)

    ell = ellipse(d[:2], **kwargs)
    res = d[2]*level

    # Switch hemispheres if PCA is upside-down
    # Normal vector is always correctly fit
    if axes[2,2] < 0:
        res *= -1

    if sheet == 'upper':
        ell += res
    elif sheet == 'lower':
        ell -= res

    _ = dot(ell,axes).T
    lon,lat = cart2sph(-_[2],_[0],_[1])
    return N.array(list(zip(lon,lat)))

def error_coords(axes, covariance_matrix, **kwargs):

    # Support for multiple levels of errors
    # (not sure if this directly corresponds
    # to sigma).
    levels = kwargs.pop('levels',None)

    u = 'upper'
    l = 'lower'

    def _(half, level=1):
        lonlat = plane_errors(axes, covariance_matrix,
                half, level=level, **kwargs)
        return N.degrees(lonlat).tolist()

    def __(level):
        return dict(
            upper=_(u, level),
            lower=_(l, level))

    out = dict(nominal=_('nominal'))
    if levels is None:
        i = __(1)
    else:
        i = {l:__(l) for l in levels}
    out.update(i)
    return out
