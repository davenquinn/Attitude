import json
from .io import fixture_path
from attitude import Orientation

keys = ["strike", "dip", "rake", "min_angular_error", "max_angular_error"]


def test_pro3d_fit():
    with open(fixture_path("pro3d_2021-07-30_attitude_test_planes.json")) as f:
        data = json.load(f)[0]

        (strike, dip, rake, *angular_errors) = tuple(data[k] for k in keys)
        print(strike, dip, rake, *angular_errors)
        assert False
