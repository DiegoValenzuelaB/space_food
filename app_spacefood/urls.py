from django.urls import path
from .views import *
from .views_apis import *

urlpatterns = [
    # NO BORRAR NINGUN HOME
    path('', home, name='home'),
    path('home/', home, name='home'),
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('crearproducto/', crearproducto, name='crearproducto'),
    path('comidas/', comidas, name='comidas'),
    path('panelcomidas/', panelcomidas, name='panelcomidas'),
    path('quienes_somos/', quienes_somos, name='quienes_somos'),
    path('panelcocinero/', panelcocinero, name='panelcocinero'),
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
    path('api/listar_inventario/', listar_inventario, name='listar_inventario'),
    path('api/agregar_inventario/', agregar_inventario, name='agregar_inventario'),
    path('api/listar_sucursales/', listar_sucursales, name='listar_sucursales'),
    path('api/enviar_alerta_stock/', enviar_alerta_stock, name='enviar_alerta_stock'),
    path('api/productos_stock_bajo/', productos_stock_bajo, name='productos_stock_bajo'),
    path('api/listar_productos/', listar_productos, name='listar_productos'),
    path('api/actualizar_producto/', actualizar_producto, name='actualizar_producto'),
    path('api/eliminar_producto/', eliminar_producto, name='eliminar_producto'),
    path('api/cart/transferencia_comprobante/', transferencia_comprobante, name='transferencia_comprobante'),


    # URLs para back_urls de MercadoPago
    path('pago/exitosa/', pago_exitosa, name='mp_success'),
    path('pago/fallida/', pago_fallida, name='mp_failure'),
    path('pago/pendiente/', pago_pendiente, name='mp_pending'),
    path('api/productos/', listar_productos, name='listar_productos'),
]
