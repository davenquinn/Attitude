# -*- coding: utf-8 -*-
from __future__ import division
from mplstereonet.stereonet_math import line, pole
import logging
import numpy as N
from matplotlib.patches import Polygon
from matplotlib.gridspec import GridSpec
from matplotlib.ticker import FuncFormatter
from matplotlib.pyplot import subplots

from ..display.hyperbola import HyperbolicErrors
from ..error.axes import sampling_axes, noise_axes
from ..geom.util import vector,plane

log = logging.getLogger(__name__)

def plot_aligned(pca, sparse=True, **kwargs):
    """
    Plots the residuals of a principal component
    analysis of attiude data.
    """
    colormap = kwargs.pop('colormap',None)

    A = pca.rotated()
    # Flip the result if upside down
    if pca.normal[2] < 0:
        A[:,-1] *= -1
    minmax = [(A[:,i].min(),A[:,i].max()) for i in range(3)]
    lengths = [j-i for i,j in minmax]

    if sparse:
        i = 1
        l = len(A)
        if l > 10000:
            i = N.ceil(l/10000)
            A = A[::int(i)]

    log.info("Plotting with {} points".format(len(A)))

    w = 8
    ratio = (lengths[2]*2+lengths[1])/lengths[0]*1.5
    h = w*ratio
    if h < 3: h = 3

    r = (lengths[1]+5)/(lengths[2]+5)
    if r > 5:
        r = 5

    gridspec_kw = dict(height_ratios=[r, 1, 1])

    fig, axes = subplots(3, 1,figsize=(w,h), sharex=True, sharey=True)

    fig.subplots_adjust(hspace=0.05, wspace=0.1)

    #lengths = attitude.pca.singular_values[::-1]

    titles = (
        "Plan view",
        "Long cross-section",
        "Short cross-section")

    ylabels = (
        "Meters",
        "Residuals (m)",
        "Residuals (m)")

    colors = ['cornflowerblue','red']

    hyp = sampling_axes(pca)
    vertical = vector(0,0,1)

    for i, (title,ax,(a,b),ylabel) in enumerate(
            zip(titles,axes, [(0,1),(0,2),(1,2)],ylabels)):

        kw = dict(linewidth=2, alpha=0.5)
        bounds = minmax[a]

        if b != 2:
            ax.plot(bounds,(0,0), c=colors[a], **kw)
            ax.plot((0,0),minmax[b], c=colors[b], **kw)
        else:
            ax.plot(bounds, (0,0), c=colors[a], **kw)
            v0 = N.zeros(3)
            v0[a] = 1
            axes = N.array([v0,vertical])

            ax_ = (axes@N.diag(hyp)@axes.T).T
            ax_ = N.sqrt(ax_)
            l1 = N.linalg.norm(ax_[:-1])
            l2 = N.linalg.norm(ax_[-1])
            ang_error = 2*N.degrees(N.arctan2(l2,l1))

            title += ": {:2f} m, angular error (95% CI): {:.2f}º".format(lengths[a], ang_error)

            bounds = minmax[0]
            x_ = N.linspace(bounds[0]*1.2,bounds[1]*1.2,100)

            err = HyperbolicErrors(hyp,x_,axes=axes)
            err.plot(ax, fc='#cccccc', alpha=0.3)

        #ax.set_ylim(N.array(minmax[b])*3)

        x,y = A[:,a], A[:,b]
        kw = dict(alpha=0.5, zorder=5)

        if colormap is None:
            ax.plot(x,y,c="#555555", linestyle='None', marker='.',**kw)
        else:
            kw['rasterized'] = len(x) > 500
            ax.scatter(x,y,c=A[:,-1], cmap=colormap, **kw)

        ax.set_aspect("equal")

        ax.text(0.01,.99,title,
            verticalalignment='bottom',
            transform=ax.transAxes)
        #ax.autoscale(tight=True)
        ax.yaxis.set_ticks([])
        ax.xaxis.set_ticks_position('bottom')
        if i != 2:
            ax.xaxis.set_visible(False)
            #ax.spines['bottom'].set_color('none')
        for spine in ax.spines.values():
            spine.set_visible(False)


    fig.text(0.05,0.01,"Max residual: {:2f} m".format(lengths[2]),
        verticalalignment='bottom',
        transform=ax.transAxes)


    ax.set_xlabel("Meters")
    return fig
