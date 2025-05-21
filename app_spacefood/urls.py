from django.urls import path
from .views import *
from .views_apis import *

urlpatterns = [
    # NO BORRAR NINGUN HOME
    path('', home, name='home'),
    path('home/', home, name='home'),
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('quienes_somos/', quienes_somos, name='quienes_somos'),
    path('miperfil/', miperfil, name='miperfil'),
    path('api/miperfil/', api_miperfil, name='api_miperfil'),
    path('api/logout/', logout_view, name='api_logout'),
    path('panelusuarios/', panelusuarios, name='panelusuarios'),
]
