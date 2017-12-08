from .util import vector
import numpy as N
import pytest

@pytest.mark.xfail(reason="Half-finished and likely unnecessary")
def test_right_hand_rule():
    axes = N.array([
        (0,1,0),
        (1,0,0),
        (0,0,-1)])

    for i in range(len(axes)-1):
        scalar = N.linalg.norm(N.cross(axes[i], axes[i+1]))
        assert N.abs(scalar) == 1
        if scalar == -1:
            axes[[i,i+1]] = axes[[i+1,i]]
        #axes[i+1] *= int(scalar)
    assert N.linalg.norm(N.cross(axes[-1],axes[0])) == 1
    #if axes[-1,-1] < 0:
    #    axes *= -1

    rhr_axes = N.eye(3)

    assert N.allclose(axes, rhr_axes)
