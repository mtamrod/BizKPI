# Guion del vídeo demo — BizKPI

> Vídeo de **2 minutos** para presentar la app. Sirve como:
> - Plan B en la defensa si la demo en vivo falla
> - Embebido en la landing page (sección hero)
> - Post de LinkedIn anunciando el proyecto

---

## Preparación previa (5 min)

- [ ] App instalada y abierta en el dispositivo
- [ ] Cuenta de demo creada (`demo@bizkpi.com` / contraseña fácil)
- [ ] **3 semanas** de datos ficticios ya introducidas (para que el Dashboard se vea poblado)
- [ ] **1 recomendación de IA** generada (para que la pantalla de IA tenga contenido)
- [ ] Tema **oscuro** activo
- [ ] Idioma **español**
- [ ] Dispositivo en modo **No molestar** (sin notificaciones)
- [ ] Audio del dispositivo en silencio (la voz va aparte si decides añadir narración)

### Herramientas de grabación

| Plataforma | Herramienta | Notas |
|---|---|---|
| **iPad / iPhone** | Centro de Control → "Grabar pantalla" | Más sencillo, sin instalar nada |
| **Emulador Android** | OBS Studio (gratis) | Mejor calidad y control |
| **Edición** | iMovie / CapCut / DaVinci Resolve | Cualquiera gratis |

---

## Estructura del vídeo (≈ 115 segundos)

### [00:00 - 00:08] Intro — Logo + claim (8s)

**Imagen:** Pantalla en negro con el wordmark "BizKPI" centrado, animación de fade-in.
Línea inferior: *"Business Intelligence para pequeños negocios"*.

**Voz / texto en pantalla (opcional):**
> "BizKPI: lleva la salud financiera de tu negocio en el bolsillo."

> 💡 Si no haces voz, basta con texto en pantalla. Puedes generar la intro en Canva o CapCut con plantillas gratis.

---

### [00:08 - 00:18] Login (10s)

**Acción:** Abrir la app, mostrar la pantalla de login. Tocar el campo de email, escribir `demo@bizkpi.com`. Tocar contraseña, escribir (que se vean los •••). Pulsar "Iniciar sesión".

**Texto opcional en pantalla:**
> "Login rápido con email"

---

### [00:18 - 00:38] Dashboard (20s)

**Acción:** Mostrar el dashboard a pantalla completa. Hacer scroll lento de arriba a abajo:
- KPIs (ingresos, clientes, beneficio, ventas) con sus tendencias
- Gráfico de línea de ingresos
- Gráfico de barras
- Donut de categorías

**Texto en pantalla:**
> "Tu negocio de un vistazo. Cuatro KPIs principales, tres gráficos."

---

### [00:38 - 00:58] Registro de datos (20s)

**Acción:**
1. Tocar pestaña **Datos** (icono +)
2. Mostrar el formulario
3. Rellenar rápido: `2450` ingresos, `1320` gastos, `87` ventas, `64` clientes
4. Pulsar **Guardar**
5. Mostrar el toast de confirmación verde

**Texto en pantalla:**
> "Solo 4 campos por semana. Validación inline. Cero fricciones."

---

### [00:58 - 01:25] Recomendaciones IA (27s)

**Acción:**
1. Tocar pestaña **IA** (icono bombilla)
2. Mostrar los chips de semanas
3. Pulsar uno con punto verde (ya tiene reco)
4. Scroll por la recomendación: resumen, highlights, acciones, forecast

**Texto en pantalla:**
> "GPT-4o analiza tus datos y te dice qué hacer esta semana."

> ⏱️ Esta es la sección estrella. Date tiempo para que el espectador lea algún highlight.

---

### [01:25 - 01:42] Historial + Exportación (17s)

**Acción:**
1. Tocar pestaña **Historial** (reloj)
2. Mostrar la lista de semanas
3. Pulsar el icono de descarga (cabecera)
4. Mostrar el modal de exportación
5. Pulsar "Exportar todo"
6. Mostrar el sheet nativo de compartir

**Texto en pantalla:**
> "Historial completo. Exportable en un clic."

---

### [01:42 - 01:55] Personalización (13s)

**Acción:**
1. Pestaña **Perfil** (icono persona)
2. Cambiar tema oscuro → claro (instantáneo)
3. Volver a oscuro
4. Cambiar idioma a inglés (la app se traduce sola)
5. Volver a español

**Texto en pantalla:**
> "Tema. Idioma. Moneda. Todo en vivo."

---

### [01:55 - 02:05] Outro — CTA (10s)

**Imagen:** Pantalla con:
- Logo BizKPI grande
- URL: `bizkpi.github.io` o `github.com/mtamrod/BizKPI`
- Iconos: GitHub · Manual · Descargar APK

**Texto en pantalla:**
> "Descárgala. Pruébala. Trabajo de Fin de Grado · 2026"

---

## Consejos de grabación

1. **Resolución:** mínimo 1080p (1920×1080). Si grabas en iPad/iPhone, lo hace nativo.
2. **Frames por segundo:** 30 fps suficiente. 60 fps si quieres scroll súper suave.
3. **No grabes verticalmente** salvo que sea solo para LinkedIn móvil. Horizontal funciona en todos lados.
4. **Antes de cada toma**, espera 1 segundo en quieto para evitar microcortes.
5. **No metas voz en vivo** la primera vez — graba primero el screen, luego añade voz/música en edición. Más control.
6. **Música de fondo gratis:** YouTube Audio Library (sin copyright), categoría "Cinematic" o "Ambient".

---

## Edición (30-45 min)

- Cortar los micropausas/errores
- Acelerar partes lentas (scroll del dashboard) al 1.5x
- Añadir transiciones suaves (fade) entre secciones
- Texto en pantalla con tipografía limpia (mismo tono que la app)
- Música de fondo a -20dB (suave)
- Outro con CTA

---

## Exportación

- Formato: **MP4 (H.264)**
- Resolución: **1080p**
- Tamaño objetivo: menos de **30 MB** para que GitHub lo acepte si lo subes al repo
- Para YouTube: cualquier calidad vale

---

## Después de grabar

### Si lo subes a YouTube (recomendado)

1. Sube como **No listado** primero para probarlo
2. Cuando estés contento, ponlo en **Público**
3. Copia el ID del vídeo (después de `?v=`)
4. Embébelo en la landing modificando `docs/index.html`:

```html
<iframe width="100%" height="450" 
  src="https://www.youtube.com/embed/TU_VIDEO_ID" 
  title="BizKPI demo"
  frameborder="0" 
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen>
</iframe>
```

### Si lo subes directo al repo

1. Crea carpeta `docs/videos/`
2. Sube `bizkpi-demo.mp4`
3. Usa `<video>` en la landing:

```html
<video controls width="100%" poster="./screenshots/05-dashboard.jpeg">
  <source src="./videos/bizkpi-demo.mp4" type="video/mp4">
</video>
```

---

## Para el post de LinkedIn

Texto sugerido:

> 🚀 Después de meses de trabajo, comparto mi Trabajo de Fin de Grado: **BizKPI**.
>
> Una app móvil multiplataforma para que pequeños negocios (bares, tiendas, talleres) puedan llevar el control de sus KPIs sin necesidad de Excel ni asesor.
>
> ✨ Funcionalidades destacadas:
> • Dashboard con KPIs en tiempo real
> • Recomendaciones generadas con IA (GPT-4o mini)
> • Multiidioma (6 idiomas) + exportación CSV
> • Autenticación JWT con Row Level Security
>
> 🛠️ Stack: React Native + Expo, FastAPI, Supabase, OpenAI.
>
> Repo, manual y landing: github.com/mtamrod/BizKPI
>
> #TFG #ReactNative #FastAPI #IA #DesarrolloMóvil
