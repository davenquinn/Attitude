from .pca import PCAOrientation, centered
import numpy as N
"""
A helper class and functions for grouped orientations
"""
class GroupedPlaneError(Exception):
    pass


class GroupedOrientation(PCAOrientation):
    def __init__(self, *orientations, **kwargs):
        self.same_plane = kwargs.pop("same_plane", False)
        all_values = N.vstack([o.array for o in orientations])
        if self.same_plane:
            array = all_values
        else:
            array = N.vstack([o.centered_array for o in orientations])
        for o in orientations:
            if hasattr(o,'members'):
                raise GroupedPlaneError("Cannot group already-grouped planes")
            o.member_of = self

        self.members = orientations

        super().__init__(array,**kwargs)
        self.mean = all_values.mean(axis=0)

    def to_mapping(self,**values):
        values.setdefault('centered_array',None)
        values['members'] = [a.hash for a in self.members]
        return super().to_mapping(**values)


def create_groups(orientations, *groups, **kwargs):
    """
    Create groups of an orientation measurement dataset
    """
    grouped = []
    for o in orientations:
        # Get rid of and recreate group membership
        o.member_of = None
        try:
            grouped += o.members
            for a in o.members:
                a.member_of = o
        except AttributeError:
            pass

    def find(uid):
        try:
            val = next(x for x in orientations if x.hash == uid)
            if val in grouped:
                raise GroupedPlaneError("{} is already in a group."
                                           .format(val.hash))
            return val
        except StopIteration:
            raise KeyError("No measurement of with hash {} found"
                           .format(uid))

    for uid_list in groups:
        vals = [find(uid) for uid in uid_list]
        o = GroupedOrientation(*vals, **kwargs)
        orientations.append(o)

    return orientations

def disable_orientations(orientations, *to_disable):
    for uid in to_disable:
        try:
            val = next(x for x in orientations if x.hash == uid)
            val.disabled = True
        except StopIteration:
            raise KeyError("No measurement of with hash {} found"
                           .format(uid))
    return orientations


