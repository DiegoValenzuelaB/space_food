from django.shortcuts import render, redirect
from .models import *

import core.firebase_app         # ← Esto fuerza a que Firebase Admin se inicialice una sola vez
from django.shortcuts import render, redirect
from django.db import transaction, IntegrityError
from django.contrib import messages
from .models import Usuario, TipoUser, Sucursal
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from firebase_admin import auth as firebase_auth

def home(request):
    # Todos los productos para la cuadrícula
    productos = Producto.objects.all()

    # Producto destacado (id 1 de ejemplo)
    try:
        featured = Producto.objects.get(pk=1)
    except Producto.DoesNotExist:
        featured = None

    return render(request, 'core/pages/home.html', {
        'productos': productos,
        'featured': featured,
    })

def register(request):
    if request.method == 'POST':
        # 1) Recopilas los datos
        p_nombre        = request.POST.get('nombre')
        s_nombre        = request.POST.get('segundoNombre')
        p_apellido      = request.POST.get('apellido')
        s_apellido      = request.POST.get('segundoApellido')
        rut             = request.POST.get('rut')
        correo_user     = request.POST.get('correo')
        contrasena      = request.POST.get('contrasena')
        confirmar       = request.POST.get('confirmarContrasena')
        fecha_nac_user  = request.POST.get('fechaNacimiento')
        direccion_user  = request.POST.get('direccion')
        telefono_user   = request.POST.get('telefono')

        tipo_user_obj   = TipoUser.objects.get(id_tipo_user=1)
        sucursal_obj    = Sucursal.objects.get(id_sucursal=1)


        if Usuario.objects.filter(rut=rut).exists():
            messages.error(request, "El usuario ya se encuentra registrado.")
            return render(request, 'core/pages/register.html')

        # 2) Valida que las contraseñas coincidan
        if contrasena != confirmar:
            messages.error(request, "Las contraseñas no coinciden.")
            return render(request, 'core/pages/register.html')

        # 3) Crea el usuario en Firebase Auth primero
        try:
            usuario_fb = firebase_auth.create_user(
                email=correo_user,
                password=contrasena,
                display_name=f"{p_nombre} {p_apellido}"
            )
            uid_fb = usuario_fb.uid

        except firebase_auth.EmailAlreadyExistsError:
            messages.error(request, "Este correo ya está registrado en Firebase.")
            return render(request, 'core/pages/register.html')

        except Exception as e:
            messages.error(request, f"Error al crear usuario en Firebase: {e}")
            return render(request, 'core/pages/register.html')

        # 4) Si Firebase fue OK, guardas solo en MySQL (sin firebase_uid)
        try:
            with transaction.atomic():
                Usuario.objects.create(
                    p_nombre        = p_nombre,
                    s_nombre        = s_nombre,
                    p_apellido      = p_apellido,
                    s_apellido      = s_apellido,
                    rut             = rut,
                    correo_user     = correo_user,
                    contrasena      = contrasena,
                    direccion_user  = direccion_user,
                    fecha_nac_user  = fecha_nac_user,
                    telefono_user   = telefono_user,
                    tipo_user       = tipo_user_obj,
                    sucursal        = sucursal_obj,
                    activo          = True,
                    # ¡ojo! no pasamos firebase_uid aquí
                )

        except IntegrityError:
            # Si falla el INSERT en MySQL, deshacemos en Firebase
            try:
                firebase_auth.delete_user(uid_fb)
            except:
                pass
            messages.error(request, "No se ha podido registrar el usuario. Verifica los datos.")
            return render(request, 'core/pages/register.html')

        except Exception as e:
            try:
                firebase_auth.delete_user(uid_fb)
            except:
                pass
            messages.error(request, f"Error inesperado al guardar en DB: {e}")
            return render(request, 'core/pages/register.html')

        # 5) Todo OK: rediriges o muestras mensaje de éxito
        messages.success(request, "El usuario se ha registrado correctamente")
        return redirect('login')

    return render(request, 'core/pages/register.html')

@csrf_exempt
def login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            id_token = data.get('idToken')

            # Verifica el token con Firebase Admin SDK
            decoded_token = firebase_auth.verify_id_token(id_token)
            uid = decoded_token['uid']
            email = decoded_token.get('email')

            # Busca el usuario en MySQL según email
            try:
                usuario_db = Usuario.objects.get(correo_user=email)
            except Usuario.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Usuario no encontrado en base de datos.'})

            # Guarda datos en sesión Django
            request.session['rut'] = usuario_db.rut
            request.session['nombre'] = f"{usuario_db.p_nombre} {usuario_db.p_apellido}"
            request.session['p_nombre'] = usuario_db.p_nombre
            request.session['correo'] = usuario_db.correo_user
            request.session['tipo_usuario'] = usuario_db.tipo_user.id_tipo_user

            return JsonResponse({'success': True})

        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Error de autenticación: {str(e)}'})

    # Si es GET, muestra formulario login normal (o redirige)
    return render(request, 'core/pages/login.html', {'segment': 'login'})

def quienes_somos(request):
    aux = {
        'segment': 'quienes_somos'
    }
    return render(request, 'core/pages/quienes_somos.html', aux)

def miperfil(request):
    aux = {
        'segment': 'miperfil'
    }
    return render(request, 'core/pages/miperfil.html', aux)

def panelusuarios(request):
    aux = {
        'segment': 'panelusuarios'
    }
    return render(request, 'core/pages/panelusuarios.html', aux)


