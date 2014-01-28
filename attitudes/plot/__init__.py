import matplotlib.pyplot as P
from mplstereonet.stereonet_math import line
import numpy as N
from matplotlib.patches import Polygon

def trend_plunge(orientation, *args, **kwargs):
	ax = kwargs.pop("ax",P.gca())
	kwargs["linewidth"] = 0
	
	a = kwargs.pop("alpha",0.7)

	el = map(N.degrees,orientation.error_ellipse(vector=True))
	lat,lon = line(el[1], el[0])
	e = Polygon(zip(lat,lon), alpha=a, **kwargs)
	ax.add_artist(e)
