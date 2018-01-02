from os import path, environ
import fiona
import numpy as N
from attitude import Orientation, ReconstructedPlane, create_groups
from json import dumps
from sys import argv

fn = path.join(environ["DATA"],'elevations.dxf')

orientations = []
with fiona.open(fn) as ds:
    for i,item in ds.items():
        coords = N.array(item['geometry']['coordinates'])
        orientations.append(Orientation(coords))

groups = (
)

orientations = create_groups(orientations, *groups,
                             same_plane=False)

collection = [a.to_mapping(color='#ff0000', type='remote')
              for a in orientations]

fn = path.join(environ["DATA"],'field-orientations.geojson')

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

output = dumps(collection,indent=4, sort_keys=True)
try:
    fn = argv[1]
    with open(fn,'w') as f:
        print(output,file=f)
except IndexError:
    print(output)

