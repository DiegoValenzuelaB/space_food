from django.shortcuts import render

def home(request):
    aux = {
        'segment': 'home'
    }
    return render(request, 'core/pages/home.html', aux)

def register(request):
    aux = {
        'segment': 'register'
    }
    return render(request, 'core/pages/register.html', aux)

def login(request):
    aux = {
        'segment': 'login'
    }
    return render(request, 'core/pages/login.html', aux)

def home_admin(request):
    aux = {
        'segment': 'home_admin'
    }
    return render(request, 'core/pages/home_admin.html', aux)