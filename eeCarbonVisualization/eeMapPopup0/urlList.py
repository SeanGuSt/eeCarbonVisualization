from django.urls import path
from . import views
app_name = "eeMapPopup0"
urlpatterns = [
    path('', views.home.as_view(), name = "map"),
    path('ajax/load-layers/', views.load_layer_values, name = "ajax_load_layer_values"),#See views.py
]