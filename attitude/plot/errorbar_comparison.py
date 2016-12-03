import syrtis_plot_style
from elevation import app, db
from elevation.models import Attitude
from sys import argv
from attitude.geom import dot
from IPython import embed

import numpy as N
from matplotlib.pyplot import subplots
from matplotlib.font_manager import FontProperties
from scipy.stats import chi2

from attitude.error.axes import sampling_axes, noise_axes
from attitude.geom.vector import unit_vector
from attitude.error import yperbolic_errors, error_bounds, vector
from attitude.plot import HyperbolicErrors

try:
    width = float(argv[3])
except IndexError:
    width = 1000

try:
    height = float(argv[4])
except IndexError:
    height = 40

def plot_component_planes(ax, attitude, axes, title, **kwargs):
    """
    Creates a view of component planes along the direction of
    maximum variability in the dataset
    """

    fit = attitude.pca()
    arr = fit.arr
    data = (fit.rotated()@axes.T).T

    width = kwargs.pop("width", None)
    if width is None:
        max = N.abs(data[0]).max()
        width = 2.5*max
    height = kwargs.pop('height',50)

    aspect_ratio = kwargs.pop("aspect_ratio",None)
    if aspect_ratio is not None:
        ax.set_aspect(aspect_ratio)

    def bounds(dim):
        v = dim/2
        return (-v,v)

    w = bounds(width)
    xvals = N.linspace(*w,401)
    ax.set_xlim(*w)
    ax.set_ylim(*bounds(height))

    ax.plot(*data, '.', color='#888888')

    # Plot error hyperbola
    hyp_axes = noise_axes(fit)
    main = HyperbolicErrors(hyp_axes, xvals, axes=axes)
    main.plot(ax, fc='dodgerblue', alpha=0.3, zorder=5)

    # Calculate angular error
    # not sure if this is fully correct
    ax_ = (axes@N.diag(hyp_axes)@axes.T).T
    ax_ = N.sqrt(ax_)
    l1 = N.linalg.norm(ax_[:-1])
    l2 = N.linalg.norm(ax_[-1])
    ang_error = 2*N.degrees(N.arctan2(l2,l1))

    bold = FontProperties(weight='bold')
    ax.text(.02, .92, title, transform=ax.transAxes,
            size=16, va='center',ha='left', fontproperties=bold)
    ax.text(.98, .92, "Angular error (95% CI): {0:.2f}º"
                   .format(ang_error),
                    transform=ax.transAxes,
                    va='center',
                    ha='right',
                    size=8)

    try:
        m = attitude.measurements
    except AttributeError:
        return

    components = [e.pca() for e in m]
    for c in components:
        hyp_axes = noise_axes(c)
        axes2d = c.axes@fit.axes.T@axes.T
        h = hyperbolic_errors(N.diag(hyp_axes), xvals, axes=axes2d.T)
        ErrorHyperbola(ax, h, fc='gray',alpha=0.05,zorder=-5)

with app.app_context():
    s = db.session
    n = int(argv[2])
    g = s.query(Attitude).get(n)

    fig, (ax1,ax2) = subplots(2,1, figsize=(5,4),sharex=True)

    vertical = vector(0,0,1)

    axes = N.array([vector(1,0,0),vertical])
    plot_component_planes(ax1, g, axes, "A",
                width=width, aspect_ratio=10)

    axes = N.array([vector(0,1,0),vertical])
    plot_component_planes(ax2, g, axes, "B",
                width=width, height=height, aspect_ratio=10)

    ax2.set_xlabel("Distance within plane (m)")

    fig.tight_layout()
    fig.subplots_adjust(left=0.10)

    fig.text(0.05, 0.5,"Distance orthogonal to plane (m)",
             ha='center',va='center', rotation='vertical')

    fig.savefig(argv[1], bbox_inches='tight')


