from os import path, environ
import fiona
import numpy as N
import attitude
from attitude import Orientation, ReconstructedPlane, create_groups
from attitude.display import plot_interactive, init_notebook_mode
from json import dumps
from sys import argv
import palettable as P

DATA = environ["DATA"]

fn = path.join(DATA, "elevations_v2.dxf")

orientations = []
with fiona.open(fn) as ds:
    for i, item in ds.items():
        coords = N.array(item["geometry"]["coordinates"])
        try:
            orientations.append(Orientation(coords))
        except ValueError:
            continue

disabled = [
    "afb1b38f",
    "ebab5ecb",
    "7b12f5d4",
    "72417f52",
    "8565a276",
    "939d9b9a",
    "e884eac1",
    "c8902997",
    "15026bc4",
    "730a6124",
    "eb31c4b0",
    "d3793eb9",
]
orientations = [o for o in orientations if o.hash not in disabled]

groups = (["3df53944", "e98e12a9"], ["493a240a", "04987fe8"], ["c2122b2a", "de785eb5"])

groupedOrientations = create_groups(orientations, *groups, same_plane=False)

collection = [a.to_mapping(color="#ff0000", type="remote") for a in groupedOrientations]

fn = path.join(DATA, "field-orientations.geojson")

with fiona.open(fn) as ds:
    for i, item in ds.items():
        p = item["properties"]
        if p["planeType"].strip() != "Bedding":
            continue

        asm = p.get("aster_smoothed")
        alt = asm

        alt -= 40  # Global datum is higher than local
        center = (*item["geometry"]["coordinates"], alt)

        err = 0.1 * N.pi / 180
        a = ReconstructedPlane(p["strike"], p["dip"], 0, err, err)
        orientation = a.to_mapping(center=center, color="#444", type="in-situ")
        collection.append(orientation)

removedUIDs = ["89636280", "6031fd6f"]
collection = [c for c in collection if 1600 < c["center"][2] < 1680]
collection = [c for c in collection if c["uid"] not in removedUIDs]

## Colormap
cmap = P.mycarta.CubeYF_7

heights = N.array([o["center"][2] for o in collection])
rng = [heights.min(), heights.max()]

for o in collection:
    ix = N.interp(o["center"][2], rng, [0, 6])
    o["color"] = cmap.hex_colors[6 - int(ix)]

output = dumps(collection, indent=4, sort_keys=True)
try:
    fn = argv[1]
    with open(fn, "w") as f:
        print(output, file=f)
except IndexError:
    print(output)
