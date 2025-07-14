from datetime import datetime 
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import *
from .serializers import *
from django.contrib.auth import logout

from rest_framework.decorators import api_view, permission_classes, parser_classes
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
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
import mercadopago
import traceback
from rest_framework.parsers import MultiPartParser, FormParser

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

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

# @api_view(['GET'])
# @permission_classes([AllowAny])
# def listar_sucursales(request):

#     sucursales = Sucursal.objects.all()
#     datos = [
#         {
#             'id':   suc.id_sucursal,
#             'nombre': suc.nom_sucursal,
#             'comuna': suc.comuna_id
#         }
#         for suc in sucursales
#     ]
#     return Response({'sucursales': datos})

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
                "success": "https://10d69d28d107.ngrok-free.app/pago/exitosa/",
                "failure": "https://10d69d28d107.ngrok-free.app/pago/fallida/",
                "pending": "https://10d69d28d107.ngrok-free.app/pago/pendiente/",
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
@permission_classes([AllowAny])  # Ya valida el token
def listar_productos(request):
    productos = Producto.objects.all()
    serializer = ProductoSerializer(productos, many=True)
    return Response({'productos': serializer.data})

@api_view(['GET'])
@permission_classes([AllowAny])
def listar_inventario(request):
    inventario = Inventario.objects.all()
    datos = []
    for item in inventario:
        datos.append({
            'id_inventario': item.id_inventario,
            'desc_inventario': item.desc_inventario,
            'cant_original': item.cant_original,
            'cant_dispo': item.cant_dispo,
            'fecha_ingreso': item.fecha_ingreso.strftime('%d-%m-%Y') if item.fecha_ingreso else '',
            'sucursal_id': item.sucursal_id.id_sucursal if item.sucursal_id else None,
            'sucursal_nombre': item.sucursal_id.nom_sucursal if item.sucursal_id else '',
        })
    return Response({'inventario': datos})

@api_view(['POST'])
@permission_classes([AllowAny])
def agregar_inventario(request):
    data = request.data
    print("Datos recibidos:", data)
    try:
        sucursal = Sucursal.objects.get(id_sucursal=data['sucursal_id'])
        fecha = datetime.strptime(data['fecha_ingreso'], '%Y-%m-%d').date()
        nuevo = Inventario.objects.create(
            desc_inventario=data['desc_inventario'],
            cant_dispo=int(data['cant_dispo']),
            cant_original=int(data['cant_original']),
            fecha_ingreso=fecha,
            sucursal_id=sucursal
        )

        return Response({'mensaje': 'Producto agregado', 'id': nuevo.id_inventario}, status=201)
    except Sucursal.DoesNotExist:
        return Response({'error': 'Sucursal no existe'}, status=400)
    except ValueError as ve:
        return Response({'error': 'Error de formato: ' + str(ve)}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def listar_sucursales(request):
    sucursales = Sucursal.objects.select_related('comuna').all()
    datos = [
        {
            'id':      suc.id_sucursal,
            'nombre':  suc.nom_sucursal,
            'comuna':  suc.comuna.desc_comuna
        }
        for suc in sucursales
    ]
    return Response({'sucursales': datos})


def enviar_alerta_stock(productos_bajos):
    remitente = "dkasociados0001@gmail.com"
    destinatario = "dkasociados0001@gmail.com"

    # Obtener fecha y hora actual
    ahora = datetime.now()
    fecha_hora_str = ahora.strftime("%d/%m/%Y %H:%M:%S")

    # Asunto con fecha y hora
    asunto = f"Alerta: Stock bajo en inventario ({fecha_hora_str})"

    # Cuerpo HTML
    cuerpo = f"<h2>📅 Informe generado el {fecha_hora_str}</h2>"
    cuerpo += "<h3>Productos con stock disponible igual o menor a 15</h3><ul>"

    for prod in productos_bajos:
        cant_orig = prod.get("cant_original", "N/A")
        cuerpo += (
            f"<li><strong>{prod['desc_inventario']}</strong> - "
            f"{prod['cant_dispo']} unidades (Sucursal {prod['sucursal_id']}), "
            f"Cantidad original: {cant_orig}</li>"
        )
    cuerpo += "</ul>"

    msg = MIMEMultipart()
    msg["From"] = remitente
    msg["To"] = destinatario
    msg["Subject"] = asunto
    msg.attach(MIMEText(cuerpo, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as servidor:
            servidor.login(remitente, "jquw hnft eync huko")
            servidor.send_message(msg)
        print("✅ Correo enviado correctamente")
    except Exception as e:
        print(f"❌ Error enviando correo: {e}")

@api_view(['GET'])
@permission_classes([AllowAny])  # Puedes usar AllowAny si no necesitas autenticación
def productos_stock_bajo(request):
    productos_bajos = Inventario.objects.filter(cant_dispo__lte=15).values(
        'desc_inventario',
        'cant_dispo',
        'cant_original',
        'sucursal_id'
    )
    enviar_alerta_stock(productos_bajos)

    if not productos_bajos:
        return Response({"mensaje": "No hay productos con stock bajo."}, status=200)

    return Response({"productos_bajos": list(productos_bajos)}, status=200)

@api_view(['GET'])
@permission_classes([AllowAny])
def listar_productos(request):
    productos = Producto.objects.all()
    datos = []
    for prod in productos:
        datos.append({
            'id_producto': prod.id_producto,
            'nom_producto': prod.nom_producto,
            'desc_prod': prod.desc_prod,
            'precio_prod': float(prod.precio_prod),
            'stock': prod.stock,
            'fecha_elaboracion': prod.fecha_elaboracion.strftime('%d-%m-%Y') if prod.fecha_elaboracion else '',
            'fecha_vencimiento': prod.fecha_vencimiento.strftime('%d-%m-%Y') if prod.fecha_vencimiento else '',
            'tipo_producto_id': prod.tipo_producto.id_tipo_prod if prod.tipo_producto else None,
            'tipo_producto_desc': prod.tipo_producto.desc_tipo_prod if prod.tipo_producto else '',
            'marca_id': prod.marca.id_marca if prod.marca else None,
            'marca_desc': prod.marca.desc_marca if prod.marca else '',
            'imagen': prod.imagen
        })
    return Response({'productos': datos})

@csrf_exempt
def actualizar_producto(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            id_producto = data.get("id_producto")
            nom_producto = data.get("nom_producto")
            desc_prod = data.get("desc_prod")
            precio_prod = data.get("precio_prod")
            stock = data.get("stock")

            producto = Producto.objects.get(pk=id_producto)
            producto.nom_producto = nom_producto
            producto.desc_prod = desc_prod
            producto.precio_prod = precio_prod
            producto.stock = stock
            producto.save()

            return JsonResponse({"success": True})

        except Producto.DoesNotExist:
            return JsonResponse({"success": False, "message": "Producto no encontrado."})

        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})

    return JsonResponse({"success": False, "message": "Método no permitido."})

#eliminar comida
@csrf_exempt
def eliminar_producto(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            id_producto = data.get("id_producto")
            producto = Producto.objects.get(pk=id_producto)
            producto.delete()
            return JsonResponse({"success": True})
        except Producto.DoesNotExist:
            return JsonResponse({"success": False, "message": "Producto no encontrado."})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)})
    return JsonResponse({"success": False, "message": "Método no permitido."})

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def transferencia_comprobante(request):
    if 'comprobante' not in request.FILES:
        return Response({'error': 'No se recibió ningún archivo bajo la clave "comprobante".'}, status=400)

    comprobante = request.FILES['comprobante']

    # Verificar token y obtener usuario
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Token no proporcionado o formato inválido'}, status=401)
    
    try:
        token = auth_header.split(' ')[1]
        decoded = firebase_auth.verify_id_token(token)
        correo_user = decoded.get("email")
        
        if not correo_user:
            return Response({'error': 'Correo no encontrado en token'}, status=400)
            
        usuario = Usuario.objects.get(correo_user=correo_user)
        nombre_usuario = f"{usuario.p_nombre} {usuario.p_apellido} ({usuario.correo_user})"
        
    except (IndexError, RevokedIdTokenError, ValueError) as e:
        return Response({'error': f'Token inválido: {str(e)}'}, status=401)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no registrado en la base de datos'}, status=404)
    except Exception as e:
        return Response({'error': f'Error al obtener usuario: {str(e)}'}, status=500)

    # Configurar datos del correo
    remitente = "dkasociados0001@gmail.com"
    destinatario = "dkasociados0001@gmail.com"
    asunto = "Nuevo comprobante de transferencia"
    cuerpo = (
        f"<p><strong>Usuario:</strong> {nombre_usuario}</p>"
        f"<p><strong>Fecha:</strong> {datetime.now().strftime('%d-%m-%Y %H:%M:%S')}</p>"
        f"<p>Adjunto va el comprobante de la transferencia.</p>"
    )

    # Preparamos el mensaje
    msg = MIMEMultipart()
    msg["From"] = remitente
    msg["To"] = destinatario
    msg["Subject"] = asunto
    msg.attach(MIMEText(cuerpo, "html"))

    # Adjuntamos el comprobante
    part = MIMEApplication(comprobante.read(), Name=comprobante.name)
    part['Content-Disposition'] = f'attachment; filename="{comprobante.name}"'
    msg.attach(part)

    # Envío SMTP
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as servidor:
            servidor.login(remitente, "jquw hnft eync huko")
            servidor.send_message(msg)
        return Response({'ok': '✅ Comprobante enviado correctamente por correo.'}, status=200)
    except Exception as e:
        return Response({'error': f'❌ No se pudo enviar el correo: {str(e)}'}, status=500)
