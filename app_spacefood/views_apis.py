from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import *
from .serializers import UsuarioSerializer
from django.contrib.auth import logout

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import AuthenticationFailed
from django.views.decorators.http import require_GET, require_POST
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from firebase_admin import auth as firebase_auth
from firebase_admin.auth import RevokedIdTokenError
import json
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.shortcuts import redirect, render
from django.urls import reverse
import mercadopago
import traceback

mp = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)

def verificar_firebase_token(view_func):
    def wrapper(request, *args, **kwargs):
        id_token = request.headers.get('Authorization')
        if not id_token:
            raise AuthenticationFailed('Token no proporcionado')

        try:
            if id_token.startswith('Bearer '):
                id_token = id_token.split(' ')[1]

            decoded_token = firebase_auth.verify_id_token(id_token, check_revoked=True)
            request.firebase_user = decoded_token
        except RevokedIdTokenError:
            raise AuthenticationFailed('Token revocado. Por favor, inicie sesión nuevamente.')
        except Exception as e:
            raise AuthenticationFailed(f'Token inválido: {str(e)}')

        return view_func(request, *args, **kwargs)
    return wrapper


@require_GET
@verificar_firebase_token
@permission_classes([IsAuthenticated])
def api_miperfil(request):
    email = request.firebase_user.get('email')
    if not email:
        return JsonResponse({'error': 'Email no encontrado en token'}, status=400)

    try:
        usuario_db = Usuario.objects.get(correo_user=email)
    except Usuario.DoesNotExist:
        return JsonResponse({'error': 'Usuario no encontrado en base de datos'}, status=404)

    usuario_data = {
        'p_nombre': usuario_db.p_nombre,
        's_nombre': usuario_db.s_nombre if usuario_db.s_nombre else '(No definido)',
        'p_apellido': usuario_db.p_apellido,
        's_apellido': usuario_db.s_apellido,
        'rut': usuario_db.rut,
        'telefono_user': usuario_db.telefono_user,
        'direccion_user': usuario_db.direccion_user,
        'fecha_nac_user': usuario_db.fecha_nac_user.strftime('%d-%m-%Y') if usuario_db.fecha_nac_user else '',
        'correo_user': usuario_db.correo_user,
    }

    return JsonResponse({'usuario': usuario_data})


@permission_classes([IsAuthenticated])
@api_view(['POST'])
def logout_view(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return Response({'detail': 'Token no proporcionado'}, status=status.HTTP_401_UNAUTHORIZED)
    
    id_token = auth_header.split(' ')[1]

    try:
        decoded_token = firebase_auth.verify_id_token(id_token, check_revoked=True)
        uid = decoded_token['uid']
        # Revoca los tokens para este usuario
        firebase_auth.revoke_refresh_tokens(uid)
    except Exception as e:
        return Response({'detail': f'Error al verificar o revocar token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)

    logout(request)
    return Response({'detail': 'Sesión cerrada y tokens revocados'}, status=status.HTTP_200_OK)


#key: rut
#value: el rut del administrador
@api_view(['GET'])
@permission_classes([AllowAny])
def listar_usuarios(request):

    rut = request.GET.get('rut')

    if not rut:
        return JsonResponse({'error': 'Rut no proporcionado'}, status=400)

    try:
        usuario = Usuario.objects.get(rut=rut)
    except Usuario.DoesNotExist:
        return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

    if usuario.tipo_user.id_tipo_user != 5:
        return JsonResponse({'error': 'No tienes permiso para ver los usuarios'}, status=403)
    
    if usuario.tipo_user.id_tipo_user == 5:
        print("Usuario Administrador")
        usuarios = Usuario.objects.all()
        datos = []
        for u in usuarios:
            datos.append({
                'p_nombre': u.p_nombre,
                's_nombre': u.s_nombre if u.s_nombre else '(No definido)',
                'p_apellido': u.p_apellido,
                's_apellido': u.s_apellido,
                'rut': u.rut,
                'telefono': u.telefono_user,
                'direccion': u.direccion_user,
                'fecha_nacimiento': u.fecha_nac_user.strftime('%d-%m-%Y') if u.fecha_nac_user else '',
                'correo': u.correo_user,
                'tipo_user': u.tipo_user.desc_tipo_user,
                'activo': u.activo,
            })
        return Response({'usuarios': datos})


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_tipo_user(request):
    tipos_usuario = TipoUser.objects.all()
    datos = []
    for tipo in tipos_usuario:
        datos.append({
            'id_tipo_user': tipo.id_tipo_user,
            'desc_tipo_user': tipo.desc_tipo_user,
        })
    return Response({'tipos_usuario': datos})


@api_view(['POST'])
@permission_classes([AllowAny])
def actualizar_tipo_user(request):
    data = request.data
    rut = data.get('rut')
    id_tipo_user = data.get('id_tipo_user')
    activo = data.get('activo')  # puede venir como True, False, 'true', 'false'

    if not rut or not id_tipo_user:
        return JsonResponse({'error': 'Rut o id_tipo_user no proporcionados'}, status=400)

    try:
        usuario = Usuario.objects.get(rut=rut)
        tipo_usuario = TipoUser.objects.get(id_tipo_user=id_tipo_user)

        usuario.tipo_user = tipo_usuario

        if activo is not None:
            if isinstance(activo, str):
                activo = activo.lower() == "true"
            usuario.activo = activo

        usuario.save()

        return JsonResponse({'mensaje': 'Usuario actualizado correctamente'})

    except Usuario.DoesNotExist:
        return JsonResponse({'error': 'Usuario no encontrado'}, status=404)
    except TipoUser.DoesNotExist:
        return JsonResponse({'error': 'Tipo de usuario no encontrado'}, status=404)



@api_view(['GET'])
@permission_classes([AllowAny])
def listar_estados_user(request):
    usuarios = Usuario.objects.all()
    datos = []
    for u in usuarios:
        datos.append({
            'rut': u.rut,
            'activo': u.activo,
            'estado_desc': 'Activo' if u.activo else 'Inactivo'
        })
    return Response({'usuarios': datos})

def _get_cart(session):
    return session.setdefault('cart', {})

def cart_detail(request):
    return JsonResponse({'cart': _get_cart(request.session)})

@csrf_exempt
@require_POST
def cart_add(request):
    data    = json.loads(request.body)
    pid     = data.get('id')
    img_url = data.get('img')

    prod = Producto.objects.get(pk=pid)
    cart = _get_cart(request.session)
    key  = str(pid)
    entry = cart.get(key, {'quantity': 0})
    entry['quantity'] += 1

    entry.update({
      'id':    pid,
      'name':  prod.nom_producto,
      'price': float(prod.precio_prod),
      'img':   img_url,
    })

    cart[key] = entry
    request.session.modified = True
    return JsonResponse({'cart': cart})

@csrf_exempt
@require_POST
def cart_update(request):
    data = json.loads(request.body)
    pid  = data.get('id')
    qty  = data.get('quantity', 1)
    cart = _get_cart(request.session)
    key  = str(pid)
    if key in cart:
        if qty > 0:
            cart[key]['quantity'] = qty
        else:
            cart.pop(key)
    request.session.modified = True
    return JsonResponse({'cart': cart})

@csrf_exempt
@require_POST
def cart_remove(request):
    data = json.loads(request.body)
    key  = str(data.get('id'))
    cart = _get_cart(request.session)
    cart.pop(key, None)
    request.session.modified = True
    return JsonResponse({'cart': cart})

@api_view(['GET'])
@permission_classes([AllowAny])
def listar_sucursales(request):

    sucursales = Sucursal.objects.all()
    datos = [
        {
            'id':   suc.id_sucursal,
            'nombre': suc.nom_sucursal,
            'comuna': suc.comuna_id
        }
        for suc in sucursales
    ]
    return Response({'sucursales': datos})

@csrf_exempt
@require_POST
def crear_preference(request):
    try:
        data = json.loads(request.body)
        total = data.get("total", 0)

        mp = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
        preference_data = {
            "items": [{
                "title": "Compra en SpaceFood",
                "quantity": 1,
                "unit_price": float(total),
            }],
            "back_urls": {
                "success": "https://8931-186-189-95-219.ngrok-free.app/pago/exitosa/",
                "failure": "https://8931-186-189-95-219.ngrok-free.app/pago/fallida/",
                "pending": "https://8931-186-189-95-219.ngrok-free.app/pago/pendiente/",
            },
            # "auto_return": "approved",  # LO COMENTAMOS POR AHORA
        }

        preference_response = mp.preference().create(preference_data)
        resp = preference_response["response"]
        print("MP response completa:", json.dumps(resp, indent=2))  # verás todo en la consola

        return JsonResponse(resp)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

    
def pago_exitosa(request):
    collection_id = request.GET.get('collection_id')
    # (opcional) tu chequeo de payment_data aquí…
    # Si está aprobado, redirige al home con ?status=approved
    return redirect(reverse('home') + '?status=approved')

def pago_fallida(request):
    # Redirige al home con ?status=failed
    return redirect(reverse('home') + '?status=failed')

def pago_pendiente(request):
    # Redirige al home con ?status=pending
    return redirect(reverse('home') + '?status=pending')
   

@api_view(['GET'])
@permission_classes([AllowAny])
def payment_status(request):
    payment_id = request.GET.get('payment_id')
    if not payment_id:
        return Response({'error': 'payment_id no proporcionado'}, status=400)
    info = mp.payment().get(payment_id)
    status = info['response'].get('status')
    return Response({'status': status})

@api_view(['POST'])
@permission_classes([AllowAny])
def clear_cart(request):
    request.session['cart'] = {}
    return Response({'ok': True})

@api_view(['GET'])
@verificar_firebase_token
@permission_classes([IsAuthenticated])
def listar_productos(request):
    productos = Producto.objects.all()
    serializer = Producto(productos, many=True)
    return JsonResponse({'productos': serializer.data}, safe=False)