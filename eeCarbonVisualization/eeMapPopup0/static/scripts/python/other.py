import json
from . import constants as const
def js(dic):
    #Makes variables usable with javascript. This is a last resort, and must ONLY be used if the variable won't also be used with HTML
    return json.dumps(dic)
def calculate_centroid(geolocations):
    #for all the stations in geolocations, calculate the centroid so the map can be properly centered.
    lat = 0
    lng = 0
    num_stations = len(geolocations)
    for station in geolocations:
        lat += station[const.LATITUDE]
        lng += station[const.LONGITUDE]
    return {const.LATITUDE : lat/num_stations, const.LONGITUDE : lng/num_stations}
