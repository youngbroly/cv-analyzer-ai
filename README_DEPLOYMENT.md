# Guía de Despliegue Público: TalentMatch (Frontend + Backend)

Esta guía te ayudará a separar y desplegar tu aplicación en producción de manera 100% gratuita utilizando servicios en la nube populares.

---

## 📂 1. Estructura recomendada para GitHub

Para simplificar tus despliegues, es recomendable subir tu código en una de estas dos modalidades:

### Opción A (Estructura Monorepo - Recomendada)
Mantienes todo en un solo repositorio pero en carpetas separadas:
```text
mi-proyecto/
├── backend/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── App.tsx
        └── ...
```

### Opción B (Repositorios Separados - Más facil de configurar)
Crear dos repositorios independientes en GitHub:
1. `talentmatch-api` (para el código en Python FastAPI)
2. `talentmatch-web` (para el código en React)

---

## 🚀 2. Despliegue del Backend (FastAPI) en **Render** o **Railway**

El backend necesita correr continuamente en un servicio que soporte Python.

### Desplegar en **Render** (Gratuito)
1. Inicia sesión en [Render.com](https://render.com) usando tu cuenta de GitHub.
2. Haz clic en **New +** y selecciona **Web Service**.
3. Conecta el repositorio de tu backend (o selecciona la carpeta `backend` si usas monorepo).
4. Configura los siguientes parámetros:
   - **Language:** `Python`
   - **Build Command:** `pip install -r requirements.txt` (o `pip install -r backend/requirements.txt` si está en subcarpeta).
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT` (si está en subcarpeta, usa `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`).
5. **Variables de Entorno (CRÍTICO):**
   - Ve a la pestaña **Environment** en Render y añade la clave:
     * `GEMINI_API_KEY`: *(Tu clave secreta obtenida de Google AI Studio)*
6. Haz clic en **Deploy**. Render compilará tu aplicación y te entregará una URL pública (ejemplo: `https://talentmatch-api.onrender.com`). *¡Copia esta URL!*

---

## 🎨 3. Despliegue del Frontend (React + Vite) en **Vercel** o **Netlify**

El frontend es un sitio estático ultra rápido que interactúa con la API de Python.

### Desplegar en **Vercel**
1. Inicia sesión en [Vercel.com](https://vercel.com) con tu GitHub.
2. Haz clic en **Add New** > **Project** e importa tu repositorio del frontend.
3. Si usas monorepo, selecciona la subcarpeta `frontend` en "Root Directory".
4. En **Build & Development Settings**, verifica que el preset detectado sea **Vite** (los comandos por defecto son `npm run build` y la carpeta de salida es `dist`).
5. **Variables de Entorno (CRÍTICO):**
   - Despliega la pestaña **Environment Variables** y añade:
     * Nombre: `VITE_EXTERNAL_API_URL`
     * Valor: `https://talentmatch-api.onrender.com` *(La URL que te dió Render en el paso anterior, sin barra "/" al final)*
6. Haz clic en **Deploy**. En menos de 1 minuto, tendrás tu aplicación en vivo, accesible desde cualquier dispositivo mediante un link público gratuito de Vercel.

---

## 🧪 4. Pruebas y Uso Local con la API de Python

Si deseas correr la API de Python y el frontend localmente para probar cambios:

1. **Correr Backend:**
   ```bash
   # Instala dependencias
   pip install -r requirements.txt
   
   # Configura tu clave en terminal
   export GEMINI_API_KEY="tu_clave_aqui"  # Mac/Linux
   set GEMINI_API_KEY="tu_clave_aqui"     # Windows (CMD)
   
   # Inicia el servidor
   python main.py
   ```
   Tu API estará disponible en `http://localhost:8000`.

2. **Correr Frontend apuntando a tu API local:**
   En tu terminal de frontend, crea un archivo `.env.local` con:
   ```env
   VITE_EXTERNAL_API_URL=http://localhost:8000
   ```
   Luego inicia tu frontend de React con `npm run dev`. ¡Listo! Ambas partes estarán conectadas localmente.
