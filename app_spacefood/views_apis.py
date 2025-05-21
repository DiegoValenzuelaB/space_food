from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import *
from .serializers import UsuarioSerializer
from django.contrib.auth import logout

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import AuthenticationFailed
from django.views.decorators.http import require_GET
from django.http import JsonResponse
from firebase_admin import auth as firebase_auth
from firebase_admin.auth import RevokedIdTokenError


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
        's_nombre': usuario_db.s_nombre,
        'p_apellido': usuario_db.p_apellido,
        's_apellido': usuario_db.s_apellido,
        'rut': usuario_db.rut,
        'telefono_user': usuario_db.telefono_user,
        'direccion_user': usuario_db.direccion_user,
        'fecha_nac_user': usuario_db.fecha_nac_user.strftime('%Y-%m-%d') if usuario_db.fecha_nac_user else '',
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
