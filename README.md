# Dulce Eternidad — Boutique Floral Artesanal

Sitio web y catálogo digital para la venta de flores y ramos artesanales elaborados en técnica limpia pipas.

---

## 🚀 Despliegue en Vercel

El proyecto está 100% optimizado para ser desplegado en **Vercel** como un proyecto estático ultra rápido sin necesidad de compiladores pesados:

1. Sube este repositorio a tu cuenta de **GitHub**, **GitLab** o **Bitbucket**.
2. Ingresa a [vercel.com](https://vercel.com) e inicia sesión.
3. Haz clic en **"Add New..."** → **"Project"**.
4. Importa el repositorio de Dulce Eternidad.
5. Vercel detectará automáticamente la configuración en [`vercel.json`](file:///vercel.json).
6. Haz clic en **"Deploy"**. En segundos tu tienda estará activa con SSL gratuito y CDN mundial.

---

## 🗄️ Conexión con Supabase

El proyecto utiliza **Supabase** para:
- Base de datos relacional PostgreSQL (Catálogo de productos y configuración).
- Supabase Storage (Almacenamiento CDN de fotografías de ramos).
- Supabase Authentication (Acceso seguro al panel de administración).

### Paso 1: Configurar la Base de Datos
1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. En el panel izquierdo de Supabase, ve a **SQL Editor**.
3. Abre el archivo [`supabase_setup.sql`](file:///supabase_setup.sql), copia todo su contenido y pégalo en una nueva consulta.
4. Presiona **"Run"**. Esto creará:
   - Tablas `products` y `settings`.
   - Políticas de seguridad RLS (Lectura pública, edición solo autenticada).
   - El bucket de almacenamiento público `catalog-images`.
   - Los 8 ramos iniciales con descripciones y precios.

### Paso 2: Crear el usuario Administrador
1. En Supabase, ve a **Authentication** → **Users**.
2. Haz clic en **"Add user"** → **"Create user"**.
3. Ingresa tu correo y una contraseña segura.
4. Marca la casilla **"Auto Confirm User?"** para que puedas iniciar sesión de inmediato.

### Paso 3: Conectar la tienda
Tienes dos opciones para conectar las credenciales:

- **Opción A (Desde el Panel de Administración):**
  1. Entra a tu tienda y ve a `/login.html` (o haz clic en "Acceso administrador").
  2. Ve a **Configuración** → Tarjeta **"Base de Datos (Supabase)"**.
  3. Pega tu **Project URL** y tu **Anon Public Key** (que encuentras en Supabase: *Project Settings* → *Data API*).
  4. Haz clic en **"Probar y Conectar"**. ¡Listo!

- **Opción B (Directamente en el código):**
  1. Abre el archivo [`js/config.js`](file:///js/config.js).
  2. Rellena los campos `url` y `anonKey`:
     ```javascript
     export const ENV_CONFIG = {
       url: "https://tu-proyecto.supabase.co",
       anonKey: "eyJhbGciOi...",
     };
     ```

---

## 🛡️ Modo Offline / Salvaguarda Local
Si Supabase aún no está configurado o si la conexión a internet falla temporalmente, la tienda y el panel de administración continuarán funcionando de forma transparente gracias al sistema de contingencia basado en semillas precargadas y `localStorage`.

---

## 🛠️ Desarrollo Local
Para probar localmente:
```bash
npm run dev
# o
npx serve . -p 5173
```
Abre en tu navegador `http://localhost:5173`.
