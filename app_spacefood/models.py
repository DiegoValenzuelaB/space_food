from django.db import models

class TipoUser(models.Model):
    id_tipo_user = models.IntegerField(primary_key=True)
    desc_tipo_user = models.CharField(max_length=100)

    class Meta:
        db_table = 'tipo_user'
        managed = False

    def __str__(self):
        return self.desc_tipo_user

class Sucursal(models.Model):
    id_sucursal = models.AutoField(primary_key=True)
    comuna_id = models.CharField(max_length=100)
    nom_sucursal = models.CharField(max_length=100)
    direccion_sucursal = models.CharField(max_length=100)
    telefono_sucursal = models.CharField(max_length=100)

    class Meta:
        db_table = 'sucursal'
        managed = False

    def __str__(self):
        return self.nom_sucursal

class Usuario(models.Model):
    p_nombre = models.CharField(max_length=100)
    s_nombre = models.CharField(max_length=100, blank=True, null=True)
    p_apellido = models.CharField(max_length=100)
    s_apellido = models.CharField(max_length=100)
    rut = models.CharField(max_length=20, unique=True)
    correo_user = models.EmailField(unique=True)
    contrasena = models.CharField(max_length=100)
    direccion_user = models.CharField(max_length=100)
    fecha_nac_user = models.DateField()
    telefono_user = models.CharField(max_length=20)
    tipo_user = models.ForeignKey(TipoUser, on_delete=models.DO_NOTHING, db_column='tipo_user_id')
    sucursal = models.ForeignKey('Sucursal', on_delete=models.DO_NOTHING, db_column='sucursal_id')  # 👈 agrega este campo

    class Meta:
        db_table = 'usuario'       # 🔁 Apunta a la tabla creada en XAMPP
        managed = False         # 🚫 Evita que Django intente crear/modificar la tabla

    def __str__(self):
        return f"{self.p_nombre} {self.p_apellido}"