import numpy as N
from mplstereonet import stereonet_math
from scipy.stats import chi2
from numpy.testing import assert_array_almost_equal

from .geom.util import vector, unit_vector, dot


def quaternion(vector, angle):
    """
    Unit quaternion for a vector and an angle
    """
    return N.cos(angle / 2) + vector * N.sin(angle / 2)


def ellipse(n=1000, adaptive=False):
    """
    Get a parameterized set of vectors defining
    ellipse for a major and minor axis length.
    Resulting vector bundle has major axes
    along axes given.
    """
    u = N.linspace(0, 2 * N.pi, n)
    # Get a bundle of vectors defining
    # a full rotation around the unit circle
    return N.array([N.cos(u), N.sin(u)]).T


def sph2cart(lat, lon):
    _ = stereonet_math.sph2cart(lat, lon)
    # val = N.array(_).flatten()
    val = N.roll(_, -1)
    val[:-1] *= -1
    return val


def scale_errors(cov_axes, confidence_level=0.95):
    """
    Returns major axes of error ellipse or
    hyperbola, rescaled using chi2 test statistic
    """
    dof = len(cov_axes)
    x2t = chi2.ppf(confidence_level, dof)
    return N.sqrt(x2t * cov_axes)


def normal_errors(axes, covariance_matrix, **kwargs):
    """
    Currently assumes upper hemisphere of stereonet
    """
    level = kwargs.pop("level", 1)
    traditional_layout = kwargs.pop("traditional_layout", True)
    d = N.diagonal(covariance_matrix)
    ell = ellipse(**kwargs)

    if axes[2, 2] < 0:
        axes *= -1

    # Not sure where this factor comes from but it
    # seems to make things work better
    c1 = 2
    axis_lengths = d[:2]
    f = N.linalg.norm(ell * axis_lengths, axis=1)

    e0 = -ell.T * d[2] * c1
    e = N.vstack((e0, f))

    _ = dot(e.T, axes).T

    if traditional_layout:
        lon, lat = stereonet_math.cart2sph(_[2], _[0], -_[1])
    else:
        lon, lat = stereonet_math.cart2sph(-_[1], _[0], _[2])
    return list(zip(lon, lat))


def test_ellipse():
    ell = ellipse(n=1000)
    u = N.linspace(0, 2 * N.pi, n)
    arr = N.hstack([N.cos(u), N.sin(u)])
    assert_array_almost_equal(ell, arr)


def plane_errors(axes, covariance_matrix, sheet="upper", **kwargs):
    """
    kwargs:
    traditional_layout  boolean [True]
        Lay the stereonet out traditionally, with north at the pole of
        the diagram. The default is a more natural and intuitive visualization
        with vertical at the pole and the compass points of strike around the equator.
        Thus, longitude at the equator represents strike and latitude represents
        apparent dip at that azimuth.
    """

    level = kwargs.pop("level", 1)
    traditional_layout = kwargs.pop("traditional_layout", True)

    d = covariance_matrix

    ell = ellipse(**kwargs)
    bundle = dot(ell, d[:2])
    res = d[2] * level * 2

    # Switch hemispheres if PCA is upside-down
    # Normal vector is always correctly fit
    # if traditional_layout:
    # if axes[2,2] > 0:

    if axes[2, 2] > 0:
        res *= -1

    if sheet == "upper":
        bundle += res
    elif sheet == "lower":
        bundle -= res

    _ = dot(bundle, axes).T

    if traditional_layout:
        lon, lat = stereonet_math.cart2sph(_[2], _[0], _[1])
    else:
        lon, lat = stereonet_math.cart2sph(-_[1], _[0], _[2])

    return list(zip(lon, lat))


def iterative_normal_errors(axes, covariance_matrix, **kwargs):
    """
    Currently assumes upper hemisphere of stereonet
    """
    level = kwargs.pop("level", 1)
    traditional_layout = kwargs.pop("traditional_layout", True)
    n = kwargs.get("n", 100)

    d = N.diagonal(covariance_matrix)
    u = N.linspace(0, 2 * N.pi, n)

    if axes[2, 2] < 0:
        axes *= -1

    # Not sure where this factor comes from but it
    # seems to make things work better
    c1 = 2

    def sdot(a, b):
        return sum([i * j for i, j in zip(a, b)])

    def step_func(a):
        e = [
            -c1 * d[2] * N.cos(a),
            -c1 * d[2] * N.sin(a),
            N.linalg.norm([N.cos(a) * d[0], N.sin(a) * d[1]]),
        ]
        r = [sdot(e, i) for i in axes.T]
        if traditional_layout:
            x, y, z = r[2], r[0], -r[1]
        else:
            x, y, z = -r[1], r[0], r[2]
        r = N.sqrt(x**2 + y**2 + z**2)
        lon = N.arctan2(y, x)
        lat = N.arcsin(z / r)
        return lon, lat

    # Get a bundle of vectors defining
    # a full rotation around the unit circle
    vals = [step_func(i) for i in u]
    return vals


def iterative_plane_errors(axes, covariance_matrix, **kwargs):
    """
    An iterative version of `pca.plane_errors`,
    which computes an error surface for a plane.
    """
    sheet = kwargs.pop("sheet", "upper")
    level = kwargs.pop("level", 1)
    n = kwargs.pop("n", 100)

    cov = N.diagonal(covariance_matrix)
    u = N.linspace(0, 2 * N.pi, n)

    scales = dict(upper=1, lower=-1, nominal=0)
    c1 = scales[sheet] * 2  # We double the scale of errors since they are symmetrical
    c1 *= -1  # We assume upper hemisphere
    if axes[2, 2] < 0:
        c1 *= -1

    def sdot(a, b):
        return sum([i * j for i, j in zip(a, b)])

    def step_func(a):
        e = [N.cos(a) * cov[0], N.sin(a) * cov[1], c1 * cov[2]]
        d = [sdot(e, i) for i in axes.T]
        x, y, z = d[2], d[0], d[1]
        r = N.sqrt(x**2 + y**2 + z**2)
        lat = N.arcsin(z / r)
        lon = N.arctan2(y, x)
        return lon, lat

    # Get a bundle of vectors defining
    # a full rotation around the unit circle
    return N.array([step_func(i) for i in u])


def error_ellipse(axes, covariance_matrix, **kwargs):
    level = kwargs.pop("level", 1)
    traditional_layout = kwargs.pop("traditional_layout", True)

    d = N.sqrt(covariance_matrix)

    ell = ellipse(**kwargs)
    # Bundle of vectors surrounding nominal values
    bundle = dot(ell, d[:2])
    res = d[2] * level

    # Switch hemispheres if PCA is upside-down
    # Normal vector is always correctly fit
    if axes[2, 2] > 0:
        res *= -1

    normal = vector(0, 0, 1)

    _ = normal + bundle

    if traditional_layout:
        lon, lat = stereonet_math.cart2sph(_[2], _[0], _[1])
    else:
        lon, lat = stereonet_math.cart2sph(-_[1], _[0], _[2])

    return list(zip(lon, lat))


def error_coords(axes, covariance_matrix, **kwargs):

    # Support for multiple levels of errors
    # (not sure if this directly corresponds
    # to sigma).
    levels = kwargs.pop("levels", None)
    do_ellipse = kwargs.pop("ellipse", True)

    u = "upper"
    l = "lower"

    def _(half, level=1):
        lonlat = plane_errors(axes, covariance_matrix, half, level=level, **kwargs)
        return N.degrees(lonlat).tolist()

    def __(level):
        data = dict(upper=_(u, level), lower=_(l, level))
        if do_ellipse:
            ell = error_ellipse(axes, covariance_matrix, level=level, **kwargs)
            data["ellipse"] = N.degrees(ell).tolist()
        return data

    out = dict(nominal=_("nominal"))
    if levels is None:
        i = __(1)
    else:
        i = {l: __(l) for l in levels}
    out.update(i)
    return out
