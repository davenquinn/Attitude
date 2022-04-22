from __future__ import division
import numpy as N
import matplotlib.pyplot as P
import seaborn


def aligned_residuals(pca):
    """
    Plots error components along with bootstrap
    resampled error surface. Provides another
    statistical method to estimate the variance
    of a dataset.
    """
    A = pca.rotated()
    fig, axes = P.subplots(2, 1, sharex=True, frameon=False)
    fig.subplots_adjust(hspace=0, wspace=0.1)
    kw = dict(c="#555555", s=40, alpha=0.5)

    # lengths = attitude.pca.singular_values[::-1]
    lengths = (A[:, i].max() - A[:, i].min() for i in range(3))

    titles = (
        "Long cross-section (axis 3 vs. axis 1)",
        "Short cross-section (axis 3 vs. axis 2)",
    )

    for title, ax, (a, b) in zip(titles, axes, [(0, 2), (1, 2)]):

        seaborn.regplot(A[:, a], A[:, b], ax=ax)
        ax.text(0, 1, title, verticalalignment="top", transform=ax.transAxes)
        ax.autoscale(tight=True)
        for spine in ax.spines.itervalues():
            spine.set_visible(False)
    ax.set_xlabel("Meters")
    return fig
