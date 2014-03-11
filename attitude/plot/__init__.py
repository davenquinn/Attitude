import matplotlib.pyplot as P
from mplstereonet.stereonet_math import line, pole
import numpy as N
from matplotlib.patches import Polygon

def trend_plunge(ax, orientation, *args, **kwargs):
	levels = kwargs.pop("levels",[1])
	kwargs["linewidth"] = 0

	a = kwargs.pop("alpha",0.7)
	if len(a) != len(levels):
		a = [a]*len(levels)

	for i,level in enumerate(levels):
		el = map(N.degrees,orientation.error_ellipse(vector=True, level=level))
		lat,lon = line(el[1], el[0])
		e = Polygon(zip(lat,lon), alpha=a[i], **kwargs)
		ax.add_artist(e)

def normal(ax, orientation, *args, **kwargs):
	levels = kwargs.pop("levels",[1])
	kwargs["linewidth"] = 0

	a = kwargs.pop("alpha",0.7)
	if len(a) != len(levels):
		a = [a]*len(levels)

	for i,level in enumerate(levels):
		el = map(N.degrees,orientation.error_ellipse(vector=True, level=level))
		lat,lon = line(90-el[1], 180+el[0])
		e = Polygon(zip(lat,lon), alpha=a[i], **kwargs)
		ax.add_artist(e)

def setup_figure(*args, **kwargs):
	fig = P.figure(*args, **kwargs)
	ax = fig.add_subplot(111, projection='stereonet')
	ax.trend_plunge = trend_plunge
	ax.normal = normal
	return fig,ax
