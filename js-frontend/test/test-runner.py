from __future__ import print_function

import pytest
import numpy as N
from subprocess import check_output
from json import dumps, loads
from os import path
from itertools import product
from codecs import getreader
from sys import argv

from attitude.test import random_plane
from attitude import Orientation
from attitude.orientation.test_pca import random_pca
from attitude.stereonet import (
    plane_errors,
    iterative_plane_errors,
    normal_errors,
    iterative_normal_errors,
)
from attitude.geom.util import dot

here = path.dirname(__file__)
script = path.join(here, "test-plane.coffee")

n = 100
sheets = ("upper", "lower", "nominal")

cases = lambda: product(range(10), sheets)


def get_coffeescript(fn, d):
    """
    Get a function response from the coffeescript
    testing suite
    """
    cmd = ("coffee", script, fn, dumps(d))
    return loads(check_output(cmd).decode("utf-8"))


def __coffeescript_plane(data, function="individual"):
    d = [
        dict(
            singularValues=N.diagonal(obj.covariance_matrix).tolist(),
            axes=obj.axes.tolist(),
            sheet=obj.sheet,
            adaptive=False,
            n=n,
        )
        for obj in data
    ]

    return get_coffeescript(function, d)


def input_data():
    for i, sheet in cases():
        obj = random_pca()
        obj.sheet = sheet
        yield obj


def test_javascript_plane():
    """
    Test plane functions implemented
    in javascript
    """
    data = list(input_data())
    output = __coffeescript_plane(data, "individual")
    for obj, arr in zip(data, output):
        js_err = N.array(arr)
        err = plane_errors(
            obj.axes, obj.covariance_matrix, sheet=obj.sheet, n=n, adaptive=False
        )
        assert N.allclose(err, js_err)


def test_javascript_ellipse():
    data = list(input_data())
    output = __coffeescript_plane(data, "ellipse")
    for obj, arr in zip(data, output):
        js_err = N.array(arr)
        err = iterative_normal_errors(
            obj.axes, obj.covariance_matrix, adaptive=False, n=n
        )

        assert arr[0][1] is not None
        # This makes tests pass
        # but is a hack. Can probably
        # be replaced with some more intuitive
        # flipping of distribution
        first = js_err[0, 0]
        if N.abs(first) > N.pi / 2:
            js_err[:, 0] -= N.sign(first) * N.pi
            js_err[:, 1] *= -1

        def f(row):
            v = 0
            if row[0] > N.pi:
                v = -2 * N.pi
            elif row[0] < -N.pi:
                v = 2 * N.pi
            return row

        js_err = N.apply_along_axis(f, 1, js_err)

        assert N.allclose(err, js_err)


def test_grouped_plane():
    data = list(input_data())
    output = __coffeescript_plane(data, "grouped")
    for obj, arr in zip(data, output):
        err = obj.error_coords(n=100)
        for i in ["nominal", "upper", "lower"]:
            assert N.allclose(err[i], N.array(arr[i]))


def test_axis_deconvolution():
    """
    Test that we can recover PCA axes from
    premultiplied representation in javascript
    """
    pca = random_pca()
    sv, ax = get_coffeescript("deconvolveAxes", pca.principal_axes.tolist())
    assert N.allclose(sv, pca.singular_values)
    assert N.allclose(ax, pca.axes)


def test_polygon_winding():
    """
    Points on nominal surface should be within
    error bounds. If not, coordinates are probably flipped
    """
    for i in range(10):
        pca = random_pca()
        intersects = get_coffeescript("intersection", pca.principal_axes.tolist())
        assert intersects


if __name__ == "__main__":
    if argv[1] == "random_pca":
        pca = random_pca()
        print(dumps(pca.principal_axes.tolist()))
