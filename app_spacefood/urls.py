from django.urls import path
from .views import *

urlpatterns = [
    path('', home, name='home'),
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('quienes_somos/', quienes_somos, name='quienes_somos'),
    path('miperfil/', miperfil, name='miperfil'),
]
