from __future__ import division

import numpy as N
from .util import vector, plane
from .conics import conic
from ..error import asymptotes

same = N.allclose


def test_conic_errors():
    pca_res = N.array([500, 300, 2]) ** 2
    pca_res = 1 / pca_res
    arr = N.identity(4)
    arr[0, 0] = pca_res[0]
    arr[1, 1] = pca_res[1]
    arr[2, 2] = -pca_res[2]
    arr[3, 3] = -1
    hyp = conic(arr)

    assert same(hyp.center(), vector(0, 0, 0))
    assert hyp.is_hyperbolic()

    # Plotting hyperbolic slice

    # Get hyperbolic slice on xz plane
    n = vector(0, 1, 0)
    p = plane(n)

    # Make sure plane is realistic
    assert same(p.normal(), n)
    assert same(p.offset(), vector(0, 0, 0))

    h1, rotation, offset = hyp.slice(p)

    assert h1.is_hyperbolic()
    d = N.abs(N.diagonal(h1)[:-1])
    axes = N.sqrt(1 / d)
    assert same(axes, N.array([500, 2]))

    u = lambda x: N.arcsinh(x / axes[0])
    y = lambda x: axes[1] * N.cosh(u(x))
    assert y(0) == axes[1]

    # Plotting asymptotes

    vec = asymptotes(hyp, n=1000)
    assert len(vec) == 1000
    assert same(vec[0, 0], pca_res[0])
