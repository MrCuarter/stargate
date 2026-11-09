# -*- coding: utf-8 -*-
"""El informe de la Misión 1 de CCD (Actividad 1, PER 16450) para proyectar en la clase de corrección (8-nov-2026).

Contenido: «Web clase Act1/CONTENIDO_SESION_STARGATE.md» (Drive de la UNIR), montado sin reescribir. Lo pinta
assets/js/informe.js en informe-mision1.html (la construye _build_site.py).

🔴 Privacidad (encargo de Norberto): solo nombre de pila + inicial del apellido; los ejemplos de las averías, literales pero
anónimos y sin notas. Por eso se han dejado fuera los ejemplos que delatan a alguien de la galería (la guitarra, el código
de la caja fuerte, las pistas): un ejemplo «anónimo» con el título de un trabajo destacado ya no lo es.
"""

PAGINA = "https://mistercuarter.es/unir/ccd-act1/"

INFORME = {
  "portada": {
    "kicker": "STARGATE · Informe de la Bitácora · CCD",
    "titulo": "Misión 1: lo que brilla y lo que hay que reparar",
    "sub": "Una imagen generada con IA convertida en actividad de aula. Las mejores propuestas de la tripulación y las "
           "cinco averías más repetidas, con cómo repararlas antes de la Actividad 2.",
    "sello": "Primera entrega · lo formal se enseña, no se penaliza",
  },
  "cifras": [
    ["81", "entregas analizadas"],
    ["83%", "mejoraron su prompt iterando"],
    ["89%", "documentaron el proceso en la tabla técnica"],
    ["11", "trabajos en la galería de lo mejor"],
  ],
  # [nombre, actividad, por qué destaca, enlace a la ACTIVIDAD (no al portfolio entero, 9-nov), dirección para verla
  #  incrustada en la diapositiva ("" si la web no deja: Google Sites manda X-Frame-Options DENY → se abre aparte)]
  "tripulacion": [
    ["Denis S.", "¿Qué hace cada parte de la planta?, 3.º de Primaria (Ciencias de la Naturaleza)",
     "Diseñó las tareas antes que la imagen, pidió una lámina sin texto y numerada, nombró CRAFT por partes y corrigió a mano un error de la IA (la línea del 4).",
     "https://docs.google.com/presentation/d/1cgqk3Z4fuETSnqx8qgFbiftUv7ztLh-Y/edit?usp=sharing&ouid=105739544331534608033&rtpof=true&sd=true",
     "https://docs.google.com/presentation/d/1cgqk3Z4fuETSnqx8qgFbiftUv7ztLh-Y/preview"],
    ["Paula F.", "El mercado del otoño: frutos secos y carnosos (Infantil, 4 años)",
     "Detecta que la IA colocaba los frutos secos arriba y los carnosos abajo y que eso anticipaba la respuesta: iteración por un motivo puramente didáctico, con CRAFT aplicado letra a letra.",
     "https://docs.google.com/document/d/1T9s-d5XRKpCHaffsJrJHm3RaaEZu4yN9yJUT6YR9E44/edit?usp=sharing",
     "https://docs.google.com/document/d/1T9s-d5XRKpCHaffsJrJHm3RaaEZu4yN9yJUT6YR9E44/preview"],
    ["Milton M.", "Si la electricidad fuera agua… (analogía eléctrica-hidráulica), 6.º grado, Tecnología",
     "Imagen sin texto de dos circuitos (agua y electricidad) para que el alumnado construya la analogía y discuta sus límites; iteraciones con fallos técnicos concretos detectados por el docente.",
     "https://sites.google.com/view/eportfolio-milton-mendieta/actividad-1", ""],
    ["Nerea M.", "Detectives del patio: el misterio de las cuatro llaves (4.º de Primaria, Educación Física)",
     "Misión cooperativa de Educación Física con currículo, producto (pasaporte) y tres versiones de la infografía comparadas con el porqué de cada cambio.",
     "https://view.genially.com/6aebbd7a49e046b18796c82a", "https://view.genially.com/6aebbd7a49e046b18796c82a"],
    ["María Luján M.", "Crop Challenge: Can I Trust What I See Online? (Year 4, 8-9 años, Digital Literacy)",
     "La imagen es la tarea (recorte → escena completa → edición para alfabetización mediática), está probada en el aula con resultados y la reflexión cuenta límites reales de la IA y cómo adaptó la actividad.",
     "https://view.genially.com/6ad664d7edd42f4bc1bd9a9a", "https://view.genially.com/6ad664d7edd42f4bc1bd9a9a"],
    ["Sebastián C.", "Cartilla de iniciación a la guitarra clásica (Escuela de Formación Musical, 7-14 años)",
     "Detecta que la IA no sabe contar las cuerdas y corrige a mano la imagen: la IA como lienzo y el docente como criterio, con una tarea que depende de la imagen.",
     "https://view.genially.com/6aec95e4514b6782b58578f2", "https://view.genially.com/6aec95e4514b6782b58578f2"],
    ["Isabel C.", "De las letras a las palabras (alfabetización de mujeres adultas neolectoras, Educación de Adultos)",
     "Alfabetización de mujeres adultas: detecta que la IA asocia la V con «bicicleta» y que la estética es infantil, y lo corrige con un segundo prompt; reflexión con ese mismo ejemplo.",
     "https://docs.google.com/document/d/1_kRAmvfqqpg62ak3MJo-xqXGD9YV8quZ42D9k_GIwxk/edit?usp=sharing",
     "https://docs.google.com/document/d/1_kRAmvfqqpg62ak3MJo-xqXGD9YV8quZ42D9k_GIwxk/preview"],
    ["Deicy G.", "¡Descubre las fracciones equivalentes! (amplificación y simplificación), 4.º grado",
     "Detectó y documentó errores matemáticos de la IA (6/8 dibujado como 8/8, 3/4 convertido en 2/3) y diseñó una tarea que acaba en crear, pensada para un aula sin conectividad.",
     "https://sites.google.com/view/portafolio-deicykharola/interacci%C3%B3n-con-la-ia", ""],
    ["Ana María M.", "¡Misión espacial: descubre el sistema solar! (Ciencias Naturales, 5.º de primaria)",
     "Itera para quitar las pistas que la IA metía en la ficha (nombres, «rocosos/gaseosos», recuadro de recuerda): criterio docente muy claro y bien contado.",
     "https://docs.google.com/document/d/1mTT1DhHQgW2s3l4H9_X1AagCDJfKcuFO1ks1WofzqMo/edit?usp=sharing",
     "https://docs.google.com/document/d/1mTT1DhHQgW2s3l4H9_X1AagCDJfKcuFO1ks1WofzqMo/preview"],
    ["John P.", "Misión: descifra el código (pensamiento lógico tipo Mastermind), 7.º grado, Tecnología e Informática",
     "Reto tipo Mastermind en una caja fuerte generada con IA, con CRAFT desglosado, verificación matemática de solución única y la regla «no adivines, razona».",
     "https://gepol983.wixsite.com/espacio-eportfolio/actividades",
     "https://gepol983.wixsite.com/espacio-eportfolio/actividades"],
    ["Adriana G.", "Romero el frutero: números pares e impares (Matemáticas, 1.º de primaria)",
     "Detecta que la IA cuenta mal y se inventa una cesta extra, y lo corrige en dos iteraciones con un criterio didáctico claro (números distintos, pares e impares equilibrados).",
     "https://www.canva.com/design/DAHaLZxIey8/1IG-KjbtMw3dJHAT7yylzA/view",
     "https://www.canva.com/design/DAHaLZxIey8/1IG-KjbtMw3dJHAT7yylzA/view?embed"],
  ],
  # Cada avería: clave (el ancla de la página de clase y el póster), título, el dato (cifra grande + el resto), qué pasa,
  # dos ejemplos [lo que se vio, mejor], cómo se repara [letra o "", texto] y el vídeo de YouTube (oculto e insertable).
  "averias": [
    {"k": "prompt", "rot": "Prompt", "titulo": "Un prompt con método",
     "cifra": "32 de 81", "dato": "trabajos no nombraban ningún modelo, y muchos de los que sí lo hacían no lo aplicaban.",
     "pasa": "Muchos escribieron «Modelo CRAFT», pero el prompt era una frase suelta. El modelo no se nombra: se nota. "
             "Cada letra es una parte del prompt; si falta una, la IA la rellena a su manera.",
     "ejemplos": [
       ["Eres maestra en informática y quieres crear una unidad didáctica para trabajar la historia del computador, dirigido a estudiantes de sexto grado con unas edades entre 10 y 15 años",
        "CRAFT · Contexto: unidad de historia del computador, 6.º (11-12 años). Rol: historiador de la tecnología. Acción: infografía con línea del tiempo por generaciones. Formato: 16:9, textos cortos. Tono: colorido y cercano."],
       ["Ilustración de la radicación en matemática con niños haciendo un jardín cuadrado con 16 baldosas",
        "RCTA · Rol: ilustrador de materiales de matemáticas. Contexto: 1.º de Secundaria, raíz cuadrada. Tarea: jardín de 4×4 baldosas con √16 = 4 y lados numerados 1-4. Apariencia: horizontal, colorida, números grandes."],
     ],
     "repara": [
       ["C", "<b>Contexto</b>: curso, área y tema."],
       ["R", "<b>Rol</b>: quién es la IA (ilustrador de materiales educativos…)."],
       ["A", "<b>Acción</b>: qué tiene que crear, con detalle."],
       ["F", "<b>Formato</b>: tamaño, estilo, qué incluir y qué evitar (sin texto dentro de la imagen)."],
       ["T", "<b>Tono y público</b>: para quién y cómo."],
       ["↻", "Después, <b>iterar</b>: mirar la imagen, apuntar qué falla y pedir el cambio concreto."],
     ],
     "boton": "Constructor de prompts CRAFT",
     "video": ["0tIb0_Rp12A", "Un prompt con método: CRAFT para crear imágenes educativas con IA"]},
    {"k": "apa", "rot": "APA 7", "titulo": "Citar la IA en APA 7",
     "cifra": "68 de 81", "dato": "citaron la IA, pero muchas referencias ponían el producto como autor o les faltaban datos.",
     "pasa": "El fallo estrella: poner el producto como autor («ChatGPT, 2026»). El autor es la empresa (OpenAI, Microsoft, "
             "Google, Canva). Desde septiembre de 2025 hay dos formatos: chat compartido o herramienta.",
     "ejemplos": [
       ["Citación: Copilot de Microsoft (2026)",
        "En el texto: (Microsoft, 2026). En referencias: Microsoft. (2026). <i>Copilot</i> [Modelo de lenguaje grande]. https://copilot.microsoft.com/"],
       ["Citación: Imagen generada con ChatGPT (OpenAI, s. f.). · OpenAI. (s. f.). Imágenes en ChatGPT. Centro de ayuda de OpenAI.",
        "En el texto: (OpenAI, 2026). En referencias: OpenAI. (2026). <i>ChatGPT</i> [Modelo de lenguaje grande]. https://chatgpt.com/"],
     ],
     "repara": [
       ["", "<b>Chat compartido</b>: OpenAI. (2026, 6 de noviembre). <i>Título del chat</i> [Chat de IA generativa]. ChatGPT. https://chatgpt.com/share/…"],
       ["", "<b>Herramienta</b>: Microsoft. (2026). <i>Copilot</i> [Modelo de lenguaje grande]. https://copilot.microsoft.com/"],
       ["", "<b>En el texto</b>: (OpenAI, 2026) · OpenAI (2026)."],
       ["", "<b>Pie de figura</b>: <i>Figura 1.</i> Título. Imagen generada con ChatGPT (OpenAI, 2026)."],
     ],
     "boton": "Generador de la referencia APA",
     "video": ["NU0VLueCcMQ", "Cómo citar la IA en APA 7: ChatGPT, Copilot, Gemini y Canva"]},
    {"k": "indice", "rot": "Índice", "titulo": "Índice automático y figuras numeradas",
     "pre": "Solo", "cifra": "1 de cada 4", "dato": "trabajos tenía un índice generado automáticamente.",
     "pasa": "El índice escrito a mano no se actualiza y se nota. Con los estilos de título se genera solo. Igual con figuras "
             "y tablas: una leyenda automática, no dos.",
     "ejemplos": [
       ["ÍNDICE 1. ........ Planificación de la actividad 2. ........ Descripción del recurso digital creado",
        "Estilos Título 1/Título 2 en cada apartado + Referencias › Tabla de contenido (Word) o Insertar › Índice (Docs), con número de página."],
       ["Imagen generada mediante inteligencia artificial con ChatGPT (OpenAI, 2026), a partir de un prompt diseñado por el autor para fines educativos. (sin número de figura)",
        "<i>Figura 1.</i> Título de la figura. Imagen generada con ChatGPT (OpenAI, 2026). Con Insertar título se numera sola y entra en el índice de figuras."],
     ],
     "repara": [
       ["W", "<b>Word</b>: Título 1 / Título 2 › Referencias › Tabla de contenido."],
       ["F", "<b>Figuras</b>: clic derecho › Insertar título › Figura (tablas: Tabla)."],
       ["G", "<b>Google Docs</b>: estilos de título › Insertar › Índice."],
       ["+", "Pasarse de páginas por las capturas <b>no resta</b>: lo que no quepa, al ePortfolio."],
     ],
     "boton": "Pasos para Word y Google Docs",
     "video": ["NMNkcDST2-M", "Índice automático y figuras numeradas en Word y Google Docs"]},
    {"k": "eportfolio", "rot": "ePortfolio", "titulo": "Un ePortfolio que se abre",
     "pre": "En", "cifra": "1 trabajo", "dato": "el ePortfolio no se podía abrir sin permisos (editor de Genially, Drive o Sites privados, enlaces de Microsoft de la UNIR).",
     "pasa": "Si el enlace pide iniciar sesión o lleva al editor, el docente ve una puerta cerrada, y lo que no se ve no se "
             "puede evaluar.",
     "ejemplos": [
       ["Enlace de acceso al chat: https://copilot.microsoft.com/",
        "Enlace de la conversación generado con el botón Compartir de Copilot, comprobado en una ventana de incógnito."],
       ["Enlace único de acceso al ePortafolio https://app.genially.com/…",
        "En Genially, Compartir › enlace view.genially.com/…, comprobado en una ventana de incógnito."],
     ],
     "repara": [
       ["🔒", "<b>Prueba de fuego</b>: abrir el enlace en una ventana de incógnito (Ctrl/⌘ + Mayús + N)."],
       ["G", "<b>Genially</b>: Compartir › enlace view.genially.com (nunca app.genially.com/editor)."],
       ["↗", "<b>Canva, Sites, Drive</b>: «Cualquier persona con el enlace»."],
       ["U", "Con la cuenta de la UNIR a veces solo se comparte dentro de la universidad: usar la <b>cuenta personal</b>."],
     ],
     "boton": "Pasos por plataforma",
     "video": ["F340_NWtcm0", "Que tu ePortfolio se abra: comparte bien Genially, Canva, Sites y Drive"]},
    {"k": "reflexion", "rot": "Reflexión", "titulo": "Una reflexión con chicha",
     "pre": "En", "cifra": "57 de 71", "dato": "trabajos corregidos la reflexión se quedaba en lo general.",
     "pasa": "«La IA es muy útil, pero hay que usarla con criterio» lo podría firmar cualquiera. La reflexión que vale es la "
             "propia: qué dio la IA, qué se vio mal y qué se cambió.",
     "ejemplos": [
       ["Reflexión sobre el aprendizaje: La inteligencia artificial brinda múltiples oportunidades en la innovación de la educación.",
        "«La IA escribió BOEA en lugar de BOCA; lo vi al revisar y pedí una corrección. Aprendí que el texto dentro de las imágenes hay que revisarlo palabra por palabra antes de llevarlo al aula.»"],
       ["La IA ha permitido crear un recurso visual adaptado a los contenidos y a la edad del alumnado, algo que puede resultar más complicado al buscar imágenes ya existentes en Internet.",
        "«La primera imagen era demasiado infantil y no traía heptágonos ni octógonos; se lo pedí y aun así tuve que comprobar los lados uno a uno, porque la IA no siempre cuenta bien.»"],
     ],
     "repara": [
       ["1", "¿Qué <b>falló</b> la primera vez?"],
       ["2", "¿Qué <b>cambiaste</b> tú y por qué?"],
       ["3", "¿Qué <b>límite</b> has visto?"],
       ["↻", "La iteración del prompt ya es el ejemplo perfecto: <b>contarla</b>."],
     ],
     "boton": "La reflexión, en la página de clase",
     "video": None},
  ],
  "cierre": {
    "titulo": "Rumbo a la Misión 2",
    "texto": "Todo lo de hoy, con herramientas para copiar y pegar, en la página de clase.",
    "url": PAGINA,
  },
  "pagina": PAGINA,
}
