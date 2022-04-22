import numpy as N
from matplotlib.pyplot import subplots
from scipy.stats import chi2

from ..orientation import Orientation
from ..error.axes import sampling_axes, noise_axes
from ..geom.util import vector
from .plot.cov_types import hyperbola, bootstrap_noise, augment, ci
from .hyperbola import HyperbolicErrors


def bootstrap_ci(deskewed_data):
    # Bootstrap with noise std greater of 1m or the standard deviation of residuals
    # (in this case about 1m)
    def func(arr):
        means = arr.mean(axis=0)
        arr -= means
        f = Orientation(arr)
        al = f.axes[1][1:]
        xc = xvals - means[1]
        yc = al[1] / al[0] * xc
        y = yc + means[2]
        return y

    s = deskewed_data[:, 2].std()
    if s < 1:
        s = 1
    yhat_boots = bootstrap_noise(deskewed_data, func, std=s)
    return ci(yhat_boots, axis=0)


def error_comparison(fit, do_bootstrap=False, **kwargs):

    deskewed_data = fit.rotated()
    fig, ax = subplots()

    width = kwargs.pop("width", None)
    if width is None:
        max = N.abs(deskewed_data[0]).max()
        width = 2.5 * max
    height = kwargs.pop("height", None)
    if height is None:
        height = width / 25

    aspect_ratio = kwargs.pop("aspect_ratio", None)
    if aspect_ratio is not None:
        ax.set_aspect(aspect_ratio)

    def bounds(dim):
        v = dim / 2
        return (-v, v)

    w = bounds(width)
    xvals = N.linspace(*w, 401)
    ax.set_xlim(*w)
    ax.set_ylim(*bounds(height))

    ax.plot(w, [0, 0], color="#888888", label="Nominal fit")

    ax.plot(*deskewed_data[:, 1:].T, ".", color="#aaaaaa", zorder=-5)

    # axes correspond to max angular error
    axes = N.array([vector(0, 1, 0), vector(0, 0, 1)])

    err = HyperbolicErrors(fit.singular_values, xvals, axes=axes)
    err.plot(ax, fc="#cccccc", alpha=0.3, label="Variance")

    hyp = sampling_axes(fit)
    err = HyperbolicErrors(hyp, xvals, axes=axes)
    err.plot(ax, fc="#ffcccc", alpha=0.3, label="Sampling-based")

    hyp = noise_axes(fit)
    err = HyperbolicErrors(hyp, xvals, axes=axes)
    err.plot(ax, fc="dodgerblue", alpha=0.3, label="Noise-based")

    if do_bootstrap:
        err_bands = bootstrap_ci(deskewed_data)
        ax.fill_between(
            xvals,
            *err_bands,
            facecolor="none",
            edgecolor="blue",
            alpha=0.5,
            label="Noise bootstrap",
            linestyle="--"
        )

    ax.legend()
    return fig
