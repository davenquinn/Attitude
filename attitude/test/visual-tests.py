from pathlib import Path
from os import mkdir
import matplotlib.pyplot as plt
import mplstereonet
import numpy as N
from attitude.display.stereonet import uncertain_plane, uncertain_pole
from attitude.display.polar import uncertain_pole as polar_uncertain_pole
from matplotlib.patches import Circle

# Make a directory to hold test files
__here__ = Path(__file__).parent
__base__ = __here__.parent.parent.absolute()
outdir = __base__/"output"

outdir.mkdir(exist_ok=True)

fig = plt.figure()
ax = fig.add_subplot(111, projection='stereonet')

strike, dip = 20, 3
ax.plane(strike, dip, 'k-', linewidth=1)
ax.pole(strike, dip, 'ko', markersize=3)

rake = 40
args=(ax, strike, dip, rake, 1, 5)
uncertain_pole(*args, alpha=0.5)
uncertain_plane(*args, alpha=0.5)

ax.grid()

plt.savefig(str(outdir/"stereonet-plot.pdf"), bbox_inches='tight')

fig.clear()
ax = fig.add_subplot(111, projection="polar")
ax.set_theta_zero_location('N')
ax.set_theta_direction(-1)
ax.set_rlim([0,20])
ax.set_rticks([4,8,12,16,20])
ax.grid()


strike, dip = 45, 3
rake = 0
args=(ax, strike, dip, rake, 1, 5)

polar_uncertain_pole(*args, alpha=0.5)
ax.plot(N.radians(strike), dip, 'ko', markersize=3)

strike = 80
dip = 6
ax.plot(N.radians(strike), dip, 'ko', markersize=3)
polar_uncertain_pole(ax, strike, dip, -30, 0.5, 10, alpha=0.5)
ax.grid(True)

plt.savefig(str(outdir/"polar-plot.pdf"), bbox_inches='tight')
