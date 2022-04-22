"""
Tests that check the consistency of matplotlib plots
with known-good versions.
"""
import matplotlib.pyplot as plt
import mplstereonet
import numpy as N
import pytest


@pytest.mark.mpl_image_compare
def test_stereonet_plotting():
    from attitude.display.stereonet import uncertain_plane, uncertain_pole

    fig = plt.figure()
    ax = fig.add_subplot(111, projection="stereonet")
    strike, dip, rake = 20, 3, 40
    ax.plane(strike, dip, "k-", linewidth=1)
    ax.pole(strike, dip, "ko", markersize=3)
    args = (ax, strike, dip, rake, 1, 5)
    uncertain_pole(*args, alpha=0.5)
    uncertain_plane(*args, alpha=0.5)

    ax.grid()

    return fig


@pytest.mark.mpl_image_compare
def test_polar_plotting():
    """
    Test plotting on vanilla `matplotlib` polar axes.
    """
    from .polar import pole, uncertain_pole

    fig = plt.figure()

    ax = fig.add_subplot(111, projection="polar")
    ax.set_theta_zero_location("N")
    ax.set_theta_direction(-1)
    ax.set_rlim([0, 20])
    ax.set_rticks([4, 8, 12, 16, 20])
    ax.grid()

    strike, dip = -45, 3
    rake = 0
    args = (ax, strike, dip, rake, 1, 5)

    uncertain_pole(*args, alpha=0.5)
    pole(ax, strike, dip, "ko", markersize=3)

    strike = -10
    dip = 6
    pole(ax, strike, dip, "ko", markersize=3)
    uncertain_pole(ax, strike, dip, -30, 0.5, 10, alpha=0.5)
    ax.grid(True)

    return fig
