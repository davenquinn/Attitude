import numpy as N
from mplstereonet.stereonet_math import cart2sph

from .geom.util import dot

def ellipse(n=1000):
    """
    Get a parameterized set of vectors defining
    ellipse for a major and minor axis length.
    Resulting vector bundle has major axes
    along axes given.
    """
    u = N.linspace(0,2*N.pi,n)
    # Get a bundle of vectors defining
    # a full rotation around the unit circle
    return N.array([N.cos(u),N.sin(u)]).T

def plane_errors(axes, covariance_matrix, sheet='upper',**kwargs):
    """
    kwargs:
    traditional_layout  boolean [False]
        Lay the stereonet out traditionally, with north at the pole of
        the diagram. The default is a more natural and intuitive visualization
        with vertical at the pole and the compass points of strike around the equator.
        Thus, longitude at the equator represents strike and latitude represents
        apparent dip at that azimuth.
    """

    level = kwargs.pop('level',1)
    traditional_layout = kwargs.pop('traditional_layout',False)

    d = N.sqrt(covariance_matrix)

    ell = ellipse(**kwargs)
    bundle = dot(ell, d[:2])
    res = d[2]*level

    # Switch hemispheres if PCA is upside-down
    # Normal vector is always correctly fit
    #if traditional_layout:
    if axes[2,2] > 0:
        res *= -1

    if sheet == 'upper':
        bundle += res
    elif sheet == 'lower':
        bundle -= res

    _ = dot(bundle,axes).T

    if traditional_layout:
        lon,lat = cart2sph(_[2],_[0],_[1])
    else:
        lon,lat = cart2sph(-_[1],_[0],_[2])

    return list(zip(lon,lat))

def error_ellipse(axes, covariance_matrix, **kwargs):
    level = kwargs.pop('level',1)
    traditional_layout = kwargs.pop('traditional_layout',False)

    d = N.sqrt(covariance_matrix)

    ell = ellipse(**kwargs)
    bundle = N.cross(ell, d[2])
    res = d[2]*level

    # Switch hemispheres if PCA is upside-down
    # Normal vector is always correctly fit
    #if traditional_layout:
    if axes[2,2] > 0:
        res *= -1

    _ = dot(bundle,axes).T

    if traditional_layout:
        lon,lat = cart2sph(_[2],_[0],_[1])
    else:
        lon,lat = cart2sph(-_[1],_[0],_[2])

    return list(zip(lon,lat))

def error_coords(axes, covariance_matrix, **kwargs):

    # Support for multiple levels of errors
    # (not sure if this directly corresponds
    # to sigma).
    levels = kwargs.pop('levels',None)
    do_ellipse = kwargs.pop('ellipse',True)

    u = 'upper'
    l = 'lower'

    def _(half, level=1):
        lonlat = plane_errors(axes, covariance_matrix,
                half, level=level, **kwargs)
        return N.degrees(lonlat).tolist()

    def __(level):
        data = dict(
            upper=_(u, level),
            lower=_(l, level))
        if do_ellipse:
            data['ellipse'] = error_ellipse(
                axes, covariance_matrix,
                level=level, **kwargs)
        return data

    out = dict(nominal=_('nominal'))
    if levels is None:
        i = __(1)
    else:
        i = {l:__(l) for l in levels}
    out.update(i)
    return out
