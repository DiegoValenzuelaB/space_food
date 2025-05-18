from django.shortcuts import render, redirect
from .models import *


def home(request):
    aux = {
        'segment': 'home'
    }
    return render(request, 'core/pages/home.html', aux)

def register(request):
    if request.method == 'POST':
        p_nombre = request.POST.get('nombre')
        s_nombre = request.POST.get('segundoNombre')
        p_apellido = request.POST.get('apellido')
        s_apellido = request.POST.get('segundoApellido')
        rut = request.POST.get('rut')
        correo_user = request.POST.get('correo')
        contrasena = request.POST.get('contrasena')
        confirmar = request.POST.get('confirmarContrasena')
        fecha_nac_user = request.POST.get('fechaNacimiento')
        direccion_user = request.POST.get('direccion')
        telefono_user = request.POST.get('telefono')
        tipo_user = TipoUser.objects.get(id_tipo_user=1) 
        sucursal = Sucursal.objects.get(id_sucursal=1)

        # Validar contraseña
        if contrasena != confirmar:
            return render(request, 'register.html', {
                'error': 'Las contraseñas no coinciden'
            })

        # Guardar en la BD
        Usuario.objects.create(
            p_nombre=p_nombre,
            s_nombre=s_nombre,
            p_apellido=p_apellido,
            s_apellido=s_apellido,
            rut=rut,
            correo_user=correo_user,
            contrasena=contrasena,
            fecha_nac_user=fecha_nac_user,
            tipo_user=tipo_user,
            sucursal=sucursal,
            direccion_user=direccion_user,
            telefono_user=telefono_user
        )

        return redirect('login')  # Puedes redirigir a una página de éxito

    return render(request, 'core/pages/register.html')

def login(request):
    aux = {
        'segment': 'login'
    }
    return render(request, 'core/pages/login.html', aux)
