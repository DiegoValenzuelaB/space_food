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
    path('api/listar_usuarios/', listar_usuarios, name='listar_usuarios'),
    path('api/listar_tipo_user/', listar_tipo_user, name='listar_tipo_user'),
    path('api/actualizar_tipo_user/', actualizar_tipo_user, name='actualizar_tipo_user'),
    path('api/listar_estados_user/', listar_estados_user, name='listar_estados_user'),
    path('api/cart/',        cart_detail, name='cart_detail'),
    path('api/cart/add/',    cart_add,    name='cart_add'),
    path('api/cart/update/', cart_update, name='cart_update'),
    path('api/cart/remove/', cart_remove, name='cart_remove'),
    path('api/sucursales/', listar_sucursales, name='api_sucursales'),
    path('api/mercadopago/preference/', crear_preference, name='mp_preference'),
    path('api/payment-status/', payment_status, name='payment_status'),
    path('api/cart/clear/', clear_cart, name='cart_clear'),

]
