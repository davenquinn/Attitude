"""
A helper class and functions for grouped orientations
"""
def create_groups(orientations, *groups, **kwargs):
    """
    Create groups of an orientation measurement dataset
    """
    same_plane = kwargs.pop("same_plane", False)
    return orientations
