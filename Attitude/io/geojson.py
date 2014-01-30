import json

def dump_features(features, file, float_format=""):
	class PrettyFloat(float):
		def __repr__(self):
			return '%.2f' % self

	def pretty_floats(obj):
		if isinstance(obj, float):
			return PrettyFloat(obj)
		elif isinstance(obj, dict):
			return dict((k, pretty_floats(v)) for k, v in obj.items())
		elif isinstance(obj, (list, tuple)):
			return map(pretty_floats, obj)             
		return obj

	struct = {
		"type": "FeatureCollection",
		"features": list(features)
	}
	json.dump(pretty_floats(struct), file)