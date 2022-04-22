import numpy as N
from matplotlib.patches import Polygon

from ..geom.conics import Conic, conic
from ..geom.util import angle, augment_tensor, dot, plane, vector
from .parametric import hyperbola


def apparent_dip_correction(axes):
    """
    Produces a two-dimensional rotation matrix that
    rotates a projected dataset to correct for apparent dip
    """
    a1 = axes[0].copy()
    a1[-1] = 0
    cosa = angle(axes[0], a1, cos=True)
    _ = 1 - cosa**2
    if _ > 1e-12:
        sina = N.sqrt(_)
        if cosa < 0:
            sina *= -1
        # Construct rotation matrix
        R = N.array([[cosa, sina], [-sina, cosa]])
    else:
        # Small angle, don't bother
        # (small angles can lead to spurious results)
        R = N.identity(2)
    # if axes[0,0] < 0:
    #    return R.T
    # else:
    return R


def hyperbolic_errors(
    hyp_axes,
    xvals,
    transformation=None,
    axes=None,
    means=None,
    correct_apparent_dip=True,
    reverse=False,
):
    """
    Returns a function that can be used to create a view of the
    hyperbolic error ellipse from a specific direction.

    This creates a hyperbolic quadric and slices it to form a conic
    on a 2d cartesian plane aligned with the requested direction.

    A function is returned that takes x values (distance along nominal
    line) and returns y values (width of error hyperbola)

    kwargs:
        transformation  rotation to apply to quadric prior to slicing
                        (e.g. transformation into 'world' coordinates
        axes            axes on which to slice the data
    """
    if means is None:
        means = N.array([0, 0])

    arr = augment_tensor(N.diag(hyp_axes))

    # Transform ellipsoid to dual hyperboloid
    hyp = conic(arr).dual()

    if len(hyp_axes) == 3:
        # Three_dimensional case

        if transformation is None:
            transformation = N.identity(3)
        if axes is None:
            axes = N.array([[0, 1, 0], [0, 0, 1]])

        hyp = hyp.transform(augment_tensor(transformation))

        n_ = N.cross(axes[0], axes[1])

        # Create a plane containing the two axes specified
        # in the function call
        p = plane(n_)  # no offset (goes through origin)
        h1 = hyp.slice(p, axes=axes)[0]
    else:
        # We have a 2d geometry
        h1 = hyp

    # Major axes of the conic sliced in the requested viewing
    # geometry
    A = N.sqrt(h1.semiaxes())

    yvals = A[1] * N.cosh(N.arcsinh(xvals / A[0]))

    vals = N.array([xvals, yvals]).transpose()
    nom = N.array([xvals, N.zeros(xvals.shape)]).transpose()

    # Rotate the whole result if the PCA axes aren't aligned to the
    # major axes of the view coordinate system
    ax1 = apparent_dip_correction(axes)

    # This is a dirty hack to flip things left to right
    if reverse:
        ax1 = ax1.T
    # Top
    t = dot(vals, ax1).T + means[:, N.newaxis]
    # Btm
    vals[:, -1] *= -1
    b = dot(vals, ax1).T + means[:, N.newaxis]

    nom = dot(nom, ax1).T + means[:, N.newaxis]
    return nom, b, t[:, ::-1]


def hyperbolic_errors_parametric(
    hyp_axes, xvals=None, transformation=None, axes=None, means=None
):

    if means is None:
        means = N.array([0, 0])

    arr = augment_tensor(N.diag(hyp_axes))

    # Transform ellipsoid to dual hyperboloid
    hyp = conic(arr).dual()

    if len(hyp_axes) == 3:
        # Three_dimensional case

        if transformation is None:
            transformation = N.identity(3)
        if axes is None:
            axes = N.array([[0, 1, 0], [0, 0, 1]])

        hyp = hyp.transform(augment_tensor(transformation))

        n_ = N.cross(axes[0], axes[1])

        # Create a plane containing the two axes specified
        # in the function call
        p = plane(n_)  # no offset (goes through origin)
        h1 = hyp.slice(p, axes=axes)[0]
    else:
        # We have a 2d geometry
        h1 = hyp

    # Major axes of the conic sliced in the requested viewing
    # geometry
    H = N.sqrt(h1.semiaxes())

    assert len(H) == 2

    b, a = tuple(H[::-1])
    cut_angle = N.arctan2(b, a)

    # cut_angle += 0.00001 # For cleanliness
    angles = N.linspace(cut_angle, N.pi - cut_angle, 500)
    top = angles - N.pi / 2
    bottom = (angles + N.pi / 2)[::-1]
    # Apparent dip angle correction
    a1 = axes[0].copy()
    a1[-1] = 0
    corr = angle(axes[0], a1)
    if a < 1e-5:
        a = 0

    large_number = 10e5

    def do(angles):
        # corr = N.array([N.cos(
        vals = N.array([N.tan(angles), 1 / N.cos(angles)])
        arr = H * vals.T

        sgn = N.sign(arr[0, 1])
        _ = b / a * large_number * sgn
        start = N.array([-sgn * large_number, _])
        end = N.array([sgn * large_number, _])
        arr = N.vstack((start, arr, end))

        corr = [N.cos(a), N.sin(a)]

        return (arr * corr + means).T

    b, t = tuple(do(_) for _ in [bottom, top])

    nom = N.array([[N.cos(a), N.sin(a)]])

    xvals = N.array([-10000, 10000])
    nom = N.array([xvals, N.zeros(2)]).transpose()

    # Rotate the whole result if the PCA axes aren't aligned to the
    # major axes of the view coordinate system
    ax1 = apparent_dip_correction(axes)
    # Top
    t = dot(t.T, ax1).T + means[:, N.newaxis]
    # Btm
    b[:, -1] *= -1
    b = dot(b.T, ax1).T + means[:, N.newaxis]

    nom = dot(nom, ax1).T + means[:, N.newaxis]
    return nom, b, t[:, ::-1]


def hyperbola_values(hyp_axes, xvals):
    """
    kwargs:
        transformation  rotation to apply to quadric prior to slicing
                        (e.g. transformation into 'world' coordinates
        axes            axes on which to slice the data
    """
    A = N.sqrt(hyp_axes)
    return A[1] * N.cosh(N.arcsinh(xvals / A[0]))


class HyperbolicErrors(object):
    """
    A class to simplify plotting and animation of hyperbolic error
    areas that are orthogonal to the fitted plane.
    `ax.fill_between` cannot be used for these (unless
    the plane is flat), because the coordinate system
    is rotated.
    """

    def __init__(self, *args, **kwargs):
        """Wraps `hyperbolic_errors` function."""
        if len(args):
            self.data = hyperbolic_errors(*args, **kwargs)
        else:
            self.data = None

    def __setup_hyperbola(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs

    def __construct_errors(self):
        pass

    def plot(self, ax, **kw):
        _ec = kw.pop("color", "black")
        _ec = kw.pop("fc", _ec)
        _ec = kw.get("facecolor", _ec)
        kw["facecolor"] = _ec
        _ec = kw.pop("ec", _ec)
        kw["edgecolor"] = kw.pop("edgecolor", _ec)
        # self.n, = ax.plot([],[], '-', **kw)
        patch = Polygon([[0, 0]], **kw)
        self.poly = ax.add_patch(patch)
        if self.data is not None:
            self.__set_plot_data(self.data)

    def plot_nominal(self, ax, *args, **kw):
        ax.plot(*self.data[0], *args, **kw)

    def update_data(self, *args, **kwargs):
        self.data = hyperbolic_errors(*args, **kwargs)
        self.__set_plot_data(self.data)

    def __set_plot_data(self, n):
        coords = N.concatenate((n[1], n[2]), axis=1).T
        self.poly.set_xy(coords)
