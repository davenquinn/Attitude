import numpy as N
from scipy import stats

# The below are copied from seaborn.utils because the
# changing of the environment for matplotlib is causing problems


def percentiles(a, pcts, axis=None):
    """Like scoreatpercentile but can take and return array of percentiles.
    Parameters
    ----------
    a : array
        data
    pcts : sequence of percentile values
        percentile or percentiles to find score at
    axis : int or None
        if not None, computes scores over this axis
    Returns
    -------
    scores: array
        array of scores at requested percentiles
        first dimension is length of object passed to ``pcts``
    """
    scores = []
    try:
        n = len(pcts)
    except TypeError:
        pcts = [pcts]
        n = 0
    for i, p in enumerate(pcts):
        if axis is None:
            score = stats.scoreatpercentile(a.ravel(), p)
        else:
            score = N.apply_along_axis(stats.scoreatpercentile, axis, a, p)
        scores.append(score)
    scores = N.asarray(scores)
    if not n:
        scores = scores.squeeze()
    return scores


def ci(a, which=95, axis=None):
    """Return a percentile range from an array of values."""
    p = 50 - which / 2, 50 + which / 2
    return percentiles(a, p, axis)


def augment(x):
    s = list(x.shape)
    if len(s) == 1:
        s.append(1)
    s[1] += 1
    A = N.ones(s)
    A[:, 0] = x
    return A
