import mplstereonet.stereonet_math as M
import numpy as N
from matplotlib.patches import PathPatch
from matplotlib.path import Path

from ..error.axes import sampling_axes
from ..geom.transform import rotate_2D
from ..orientation.reconstructed import ReconstructedPlane
from ..stereonet import dot, ellipse, error_ellipse, normal_errors, plane_errors


def plot_patch(ax, vertices, codes, **kwargs):
    # Make path plot in order with lines
    # https://matplotlib.org/examples/pylab_examples/zorder_demo.html
    defaults = dict(zorder=2)
    defaults.update(kwargs)

    path = Path(vertices, codes)
    patch = PathPatch(path, **defaults)
    ax.add_patch(patch)


def girdle_error(ax, fit, **kwargs):
    """
    Plot an attitude measurement on an `mplstereonet` axes object.
    """
    vertices = []
    codes = []
    for sheet in ("upper", "lower"):
        err = plane_errors(fit.axes, fit.covariance_matrix, sheet=sheet)
        lonlat = N.array(err)
        lonlat *= -1
        n = len(lonlat)
        if sheet == "lower":
            lonlat = lonlat[::-1]
        vertices += list(lonlat)
        codes.append(Path.MOVETO)
        codes += [Path.LINETO] * (n - 1)

    plot_patch(ax, vertices, codes, **kwargs)


def pole_error(ax, fit, **kwargs):
    """
    Plot the error to the pole to a plane on a `mplstereonet`
    axis object.
    """
    ell = normal_errors(fit.axes, fit.covariance_matrix)
    lonlat = N.array(ell)
    lonlat[:, 0] *= -1
    n = len(lonlat)
    codes = [Path.MOVETO]
    codes += [Path.LINETO] * (n - 1)
    vertices = list(lonlat)
    plot_patch(ax, vertices, codes, **kwargs)


def uncertain_pole(ax, *args, **kwargs):
    """
    Min and max angular errors are symmetrical and
    thus should be doubled.
    """
    fit = ReconstructedPlane(*args)
    return pole_error(ax, fit, **kwargs)


def uncertain_plane(ax, *args, **kwargs):
    fit = ReconstructedPlane(*args)
    return girdle_error(ax, fit, **kwargs)
