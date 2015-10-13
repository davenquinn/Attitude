from __future__ import division

import numpy as N
from .vector import vector
from .conics import conic

same = N.allclose

def test_conic_errors():
    pca_res = [500,300,2]
    arr = N.identity(4)
    arr[0,0] = pca_res[0]
    arr[1,1] = pca_res[1]
    arr[2,2] = -pca_res[2]
    arr[3,3] = -1
    hyp = conic(arr)

    assert same(hyp.center(), vector(0,0,0))
    assert hyp.is_hyperbolic()

