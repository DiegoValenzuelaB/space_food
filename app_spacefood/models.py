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
    rut = models.CharField(max_length=20, unique=True, primary_key=True)
    correo_user = models.EmailField(unique=True)
    contrasena = models.CharField(max_length=100)
    direccion_user = models.CharField(max_length=100)
    fecha_nac_user = models.DateField()
    telefono_user = models.CharField(max_length=20)
    tipo_user = models.ForeignKey(TipoUser, on_delete=models.DO_NOTHING, db_column='tipo_user_id')
    sucursal = models.ForeignKey('Sucursal', on_delete=models.DO_NOTHING, db_column='sucursal_id')  # 👈 agrega este campo
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'usuario'       # 🔁 Apunta a la tabla creada en XAMPP
        managed = False         # 🚫 Evita que Django intente crear/modificar la tabla

    def __str__(self):
        return f"{self.p_nombre} {self.p_apellido}"
    

class TipoProducto(models.Model):
    id_tipo_producto = models.AutoField(primary_key=True)
    desc_tipo_prod = models.CharField(max_length=100)

    class Meta:
        db_table = 'tipo_producto'
        managed = False

    def __str__(self):
        return self.nombre


class Marca(models.Model):
    id_marca = models.AutoField(primary_key=True)
    desc_marca = models.CharField(max_length=100)

    class Meta:
        db_table = 'marca'
        managed = False

    def __str__(self):
        return self.nombre


class Inventario(models.Model):
    id_inventario = models.AutoField(primary_key=True)
    desc_inventario = models.CharField(max_length=100)
    cant_original = models.IntegerField('Cantidad original')
    cant_dispo = models.IntegerField('Cantidad disponible')
    fecha_ingreso = models.DateField('Fecha de ingreso')
    sucursal_id = models.ForeignKey(Sucursal, on_delete=models.DO_NOTHING, db_column='sucursal_id')

    class Meta:
        db_table = 'inventario'
        managed = False

    def __str__(self):
        return f"Inv. {self.id_inventario}"


class Producto(models.Model):
    id_producto       = models.AutoField(primary_key=True)
    nom_producto      = models.CharField('Nombre',    max_length=100)
    desc_prod         = models.CharField('Descripción', max_length=255)
    precio_prod       = models.DecimalField('Precio',   max_digits=12, decimal_places=2)
    stock             = models.IntegerField('Stock')
    fecha_elaboracion = models.DateField('Elaboración')
    fecha_vencimiento = models.DateField('Vencimiento', blank=True, null=True)
    tipo_producto     = models.ForeignKey(TipoProducto, on_delete=models.DO_NOTHING, db_column='tipo_producto_id')
    marca             = models.ForeignKey(Marca,        on_delete=models.DO_NOTHING, db_column='marca_id')

    class Meta:
        db_table = 'producto'
        managed  = False

    def __str__(self):
        return self.nom_producto
