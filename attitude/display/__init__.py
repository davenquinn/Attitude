from os import path
from io import BytesIO
from urllib import quote
from base64 import b64encode
from jinja2 import FileSystemLoader, Environment
import numpy as N
import json

from .plot import setup_figure, strike_dip, normal,\
        trend_plunge, error_ellipse, plot_aligned,\
        strike_dip_montecarlo,\
        plane_confidence, error_asymptotes
from ..orientation import PCAOrientation, LinearOrientation

def encode(fig):
    b = BytesIO()
    fig.savefig(b, format='png',bbox_inches='tight')
    b.seek(0)
    return '<img src ="{},{}"/>'.format(
            'data:image/png;base64',
            quote(b64encode(b.read())))

def to_json(value):
    """A filter that outputs Python objects as JSON"""
    return json.dumps(value)

_ = path.join(path.dirname(__file__),'templates')
# Load templates
loader = FileSystemLoader(_)
env = Environment(loader=loader)
env.filters['figure'] = encode
env.filters['json'] = to_json

def report(*arrays, **kwargs):
    """
    Outputs a standalone HTML 'report card' for a
    measurement (or several grouped measurements),
    including relevant statistical information.
    """
    name = kwargs.pop("name",None)

    grouped = len(arrays) > 1
    if grouped:
        arr = N.concatenate(arrays)
        components = [PCAOrientation(a)
            for a in arrays]
    else:
        arr = arrays[0]
        components = []

    r = LinearOrientation(arr)
    pca = PCAOrientation(arr)

    kwargs = dict(
            levels=[1,2,3],
            alpha=[0.8,0.5,0.2],
            linewidth=2)

    ellipse=error_ellipse(pca)

    stereonet_data = dict(
        main=pca.error_coords(),
        components=[i.error_coords()
            for i in components])

    t = env.get_template("report.html")

    return t.render(
        name=name,
        regression=r,
        pca=pca,
        stereonet_data=stereonet_data,
        linear_error=error_ellipse(r),
        aligned=plot_aligned(pca),
        pca_ellipse=ellipse)
