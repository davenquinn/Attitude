from pathlib import Path
from os import mkdir
import matplotlib.pyplot as plt
import mplstereonet

# Make a directory to hold test files
__here__ = Path(__file__).parent
__base__ = __here__.parent.parent.absolute()
outdir = __base__/"output"

outdir.mkdir(exist_ok=True)

fig = plt.figure()
ax = fig.add_subplot(111, projection='stereonet')

strike, dip = 25, 20
ax.plane(strike, dip, 'k-', linewidth=1)
ax.pole(strike, dip, 'k^', markersize=3)
ax.grid()

plt.savefig(str(outdir/"stereonet-plot.pdf"), bbox_inches='tight')
