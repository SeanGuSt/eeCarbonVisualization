from django.db.models import F
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views import generic
from django.template.loader import render_to_string
import random
from collections import Counter
from .static.scripts.python.other import js, calculate_centroid, const
import numpy as np
import pandas as pd
#These sets of keys are placeholders until I have something more concrete to work with.
#excel_keys are the headers in the xlsx file.
excel_keys = [const.SITE_NAME, const.TOP, const.BOTTOM, const.LAYER_NAME, const.WAS_BD_MODELED, const.BD_METHOD, const.BULKDENSITY, const.SOC, const.SAMPLE_NUM]
#footer_keys are the keys to the dictionary superDict
footer_keys = [const.SITE_NAME, const.TOP, const.BOTTOM, const.LAYER_NAME, const.WAS_BD_MODELED, const.BD_METHOD, const.BULKDENSITY, const.SOC, const.SAMPLE_NUM]
#footer_values are the values that will go in the tooltips
footer_values = footer_keys
#Testing file, included on GitHub
filename = 'RaCA_samples.csv'#request.GET.get("filename")
df = ""
# Create your views here.
class home(generic.TemplateView):
    template_name = 'searcher/mapPractice.html'
    def get_context_data(self, **kwargs):
        global df
        df = pd.read_csv(filename, usecols = excel_keys)
        geolocations = []
        sites = unique(df[const.SITE_NAME].to_list())
        for site in sites:#This will be replaced once I have a concrete place to pull latitude and longitude from.
            geolocations.append({const.LATITUDE: random.uniform(-90, 90), const.LONGITUDE: random.uniform(-175, 175)})
        initial_geocenter = calculate_centroid(geolocations)#Where the map should be centered
        return {"geolocations": js(geolocations), "initial_geocenter" : js(initial_geocenter), "sites" : js(sites)}

def unique(list1):#Get unique entries from list1
    # insert the list to the set
    list_set = set(list1)
    # convert the set to the list
    return list(list_set)

def load_layer_values(request):
    def count_mode(myList):#Mode as in most often.
        #In this context, we find the station that appears most often, as that means it has the most layers.
        counted = Counter(myList).values()
        mode = 0
        for val in counted:
            if val > mode:
                mode = val
        return mode
    def prepare_data_4_box_chart_js(myList):
        old_num = -1
        layer_num = -1
        data_values = np.ndarray([num_layers, len(set(sample_list))]).tolist()
        for i in range(len(sample_list)):
            sample_num = sample_list[i]
            if sample_num != old_num:
                layer_num = -1
            layer_num += 1
            data_values[layer_num][sample_num-1] = myList[i]
            old_num = sample_num
        return data_values
    
    station = request.GET.get("site")
    layers = df.loc[df[const.SITE_NAME] == station]
    sample_list = layers[const.SAMPLE_NUM].to_list()
    num_layers = count_mode(sample_list)
    superDict = {"site" : station, "footer_keys" : footer_keys, "footer_values" : footer_values}
    for my_key,  excel_key in zip(footer_keys, excel_keys):
        superDict[my_key] = prepare_data_4_box_chart_js(layers[excel_key].to_list())
    superDict["data"] = prepare_data_4_box_chart_js(np.subtract(layers[const.TOP].to_list(), layers[const.BOTTOM].to_list()))
    superDict["layer_"] = unique(sample_list)
    json_stuff = js(superDict)
    return HttpResponse(json_stuff, content_type ="application/json")