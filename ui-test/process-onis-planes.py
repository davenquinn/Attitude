from os import path, environ
import fiona
import numpy as N
from attitude import Orientation, ReconstructedPlane, create_groups
from json import dumps
from sys import argv

DATA = environ['DATA']

fn = path.join(DATA,'elevations_v2.dxf')

orientations = []
with fiona.open(fn) as ds:
    for i,item in ds.items():
        coords = N.array(item['geometry']['coordinates'])
        try:
            orientations.append(Orientation(coords))
        except ValueError:
            continue

groups = (
    ["3df53944","e98e12a9"],
    ["493a240a","04987fe8"],
    ["8565a276","939d9b9a"],
    ["c2122b2a","de785eb5"],
    ["730a6124","eb31c4b0"]
)

groupedOrientations = create_groups(orientations, *groups,
                             same_plane=False)

disabled = ["afb1b38f","ebab5ecb","7b12f5d4","72417f52"]
groupedOrientations = [o for o in groupedOrientations if o.hash not in disabled]

collection = [a.to_mapping(color='#ff0000', type='remote')
              for a in groupedOrientations]

orientations = create_groups(orientations, *groups,
                             same_plane=False)

collection = [a.to_mapping(color='#ff0000', type='remote')
              for a in orientations]

fn = path.join(DATA,'field-orientations.geojson')

with fiona.open(fn) as ds:
    for i,item in ds.items():
        p = item['properties']
        if p['planeType'].strip() != 'Bedding':
            continue

        asm = p.get("aster_smoothed")
        alt = asm

        alt -= 30 # Global datum is higher than local
        center = (*item['geometry']['coordinates'],alt)

        a = ReconstructedPlane(p['strike'], p['dip'],0,0.001,0.001)
        orientation = a.to_mapping(
            center=center,
            color='#444', type='in-situ')
        collection.append(orientation)

collection = [c for c in collection if 1600 < c['center'][2] < 1680]

output = dumps(collection,indent=4, sort_keys=True)
try:
    fn = argv[1]
    with open(fn,'w') as f:
        print(output,file=f)
except IndexError:
    print(output)

