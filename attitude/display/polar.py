"""
Functions to support polar plotting in a "dip, dip direction"
framework. Necessary to support matplotlib's standard set of
polar axes.

    Note: the development version of `mplstereonet` supports
    a more robust version of polar axes, but this isn't yet
    released. See https://github.com/joferkington/mplstereonet/issues/16
"""

import numpy as N
from matplotlib.path import Path
import mplstereonet.stereonet_math as M

from ..orientation.reconstructed import ReconstructedPlane
from ..stereonet import ellipse, dot
from .stereonet import plot_patch


def pole_error(ax, fit, *args, **kwargs):
    """
    Plot a pole error on a matplotlib polar plot, to show dip directions
    with error in an intuitive way.
    """
    axes = fit.axes

    d = N.diagonal(fit.covariance_matrix)
    ell = ellipse()

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

    lon, lat = M.cart2sph(-_[0], _[1], _[2])
    # This converts us into an upper-hemisphere
    # representation
    lon -= N.pi / 2

    ell = list(zip(lon, lat))

    lonlat = N.array(ell)
    lonlat[:, 1] = 90 - N.degrees(lonlat[:, 1])

    n = len(lonlat)
    codes = [Path.MOVETO]
    codes += [Path.LINETO] * (n - 1)

    vertices = list(lonlat)
    plot_patch(ax, vertices, codes, **kwargs)


def uncertain_pole(ax, *args, **kwargs):
    fit = ReconstructedPlane(*args)
    return pole_error(ax, fit, **kwargs)


def pole(ax, strike, dip, *args, **kwargs):
    dip_direction = strike + 90
    ax.plot(N.radians(dip_direction), dip, *args, **kwargs)
