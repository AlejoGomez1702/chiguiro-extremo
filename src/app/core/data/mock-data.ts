// Datos de ejemplo tomados del demo aprobado por el cliente.
// Se reemplazarán por consultas a Supabase (ver DataService).
import { Access, Pin, Post, Product, Race, Rider, ScheduleDay } from "./models";

export const RACES: Race[] = [
  {
    "id": "mzl",
    "num": "01",
    "code": "CO",
    "title": "Manizales",
    "short": "Manizales",
    "place": "Caldas, Colombia",
    "date": "Sábado 9 de enero de 2027",
    "dshort": "9 ENE 2027",
    "dsub": "Sábado · horarios ilustrativos",
    "status": "proxima",
    "statusLabel": "Próxima",
    "img": "/assets/img/escena-escalinata.svg",
    "hasMap": true,
    "isNext": true,
    "insc": "Inscripción abierta",
    "facts": [
      { "v": "1,5 km", "k": "Longitud*" },
      { "v": "215 m", "k": "Desnivel*" },
      { "v": "7", "k": "Secciones*" },
      { "v": "~2:30 min", "k": "Tiempo estimado*" }
    ],
    "factsNote": "* Trazado propuesto sobre calles reales de Manizales (OpenStreetMap) con relieve Copernicus; por confirmar con el equipo de trazado.",
    "infoHint": "Pilotos, horarios, accesos",
    "mapHint": "Mapa ilustrativo",
    "covHint": "Galería, noticias, video",
    "kits": "El viernes 8 de enero en la fan zone (punto M del trazado ilustrativo)."
  },
  {
    "id": "per",
    "num": "02",
    "code": "PE",
    "title": "Perú",
    "short": "Perú",
    "place": "Ciudad por anunciar",
    "date": "Domingo 7 de febrero de 2027",
    "dshort": "7 FEB 2027",
    "dsub": "Domingo · ciudad por anunciar",
    "status": "fecha",
    "statusLabel": "Fecha confirmada",
    "img": null,
    "hasMap": false,
    "isNext": false,
    "insc": "Inscripción: por anunciar",
    "facts": [
      {
        "v": "Por anunciar",
        "k": "Ciudad"
      },
      {
        "v": "Por anunciar",
        "k": "Longitud"
      },
      {
        "v": "Por anunciar",
        "k": "Desnivel"
      },
      {
        "v": "Por anunciar",
        "k": "Secciones"
      }
    ],
    "factsNote": "La ficha se completa cuando el organizador confirme la ciudad.",
    "infoHint": "Fecha y avisos",
    "mapHint": "Por anunciar",
    "covHint": "Anuncios de la sede",
    "mapNote": "El mapa se publicará con su versión y fecha de actualización cuando se confirme la ciudad.",
    "kits": "Lugar y horario: por anunciar."
  },
  {
    "id": "mex",
    "num": "03",
    "code": "MX",
    "title": "México",
    "short": "México",
    "place": "Ciudad por anunciar",
    "date": "Marzo de 2027 · fecha exacta por anunciar",
    "dshort": "MAR 2027",
    "dsub": "Fecha exacta por anunciar",
    "status": "tba",
    "statusLabel": "Por anunciar",
    "img": null,
    "hasMap": false,
    "isNext": false,
    "insc": "Inscripción: por anunciar",
    "facts": [
      {
        "v": "Por anunciar",
        "k": "Ciudad"
      },
      {
        "v": "Por anunciar",
        "k": "Fecha exacta"
      },
      {
        "v": "Por anunciar",
        "k": "Longitud"
      },
      {
        "v": "Por anunciar",
        "k": "Desnivel"
      }
    ],
    "factsNote": "La ficha se completa cuando el organizador confirme ciudad y fecha.",
    "infoHint": "Avisos de la sede",
    "mapHint": "Por anunciar",
    "covHint": "Anuncios de la sede",
    "mapNote": "El mapa se publicará cuando se confirmen la ciudad y la fecha exacta.",
    "kits": "Lugar y horario: por anunciar."
  }
];

export const PINS: Pin[] = [
  {
    "id": "S",
    "kind": "route",
    "label": "Salida · Parte alta",
    "x": 22,
    "y": 8,
    "group": "Trazado",
    "desc": "Zona de corredores. Sin acceso de público."
  },
  {
    "id": "1",
    "kind": "route",
    "label": "Sección 1 · Escalinata",
    "x": 35,
    "y": 24,
    "group": "Trazado",
    "desc": "Escalones y barandas: el tramo más técnico."
  },
  {
    "id": "2",
    "kind": "route",
    "label": "Sección 2 · Drop del muro",
    "x": 48,
    "y": 52,
    "group": "Trazado",
    "desc": "Caída sobre la calle principal."
  },
  {
    "id": "M",
    "kind": "route",
    "label": "Meta · Plaza y fan zone",
    "x": 62,
    "y": 88,
    "group": "Trazado",
    "desc": "Premiación, tienda oficial y entrega de kits."
  },
  {
    "id": "A",
    "kind": "pub",
    "label": "Zona de público A · Salto",
    "x": 58,
    "y": 38,
    "group": "Zonas de público",
    "desc": "La mejor vista de los saltos."
  },
  {
    "id": "B",
    "kind": "pub",
    "label": "Zona de público B · Curva",
    "x": 30,
    "y": 64,
    "group": "Zonas de público",
    "desc": "Zona familiar."
  },
  {
    "id": "N",
    "kind": "acc",
    "label": "Acceso norte · Transporte",
    "x": 9,
    "y": 30,
    "group": "Accesos y servicios",
    "desc": "Llegada en transporte público."
  },
  {
    "id": "E",
    "kind": "acc",
    "label": "Acceso sur · Avenida",
    "x": 90,
    "y": 80,
    "group": "Accesos y servicios",
    "desc": "Ingreso con control. Calle cerrada al tránsito."
  },
  {
    "id": "+",
    "kind": "acc",
    "label": "Primeros auxilios",
    "x": 78,
    "y": 62,
    "group": "Accesos y servicios",
    "desc": "Puesto médico y ambulancia."
  }
];

export const SCHEDULE: ScheduleDay[] = [
  {
    "day": "Viernes 8 de enero",
    "slots": [
      {
        "t": "09:00",
        "title": "Entrega de kits y acreditación",
        "place": "Fan zone",
        "pin": "M"
      },
      {
        "t": "13:00",
        "title": "Reconocimiento a pie",
        "place": "Desde la salida",
        "pin": "S"
      },
      {
        "t": "15:00",
        "title": "Entrenamientos oficiales",
        "place": "Trazado completo",
        "pin": "S"
      }
    ]
  },
  {
    "day": "Sábado 9 de enero",
    "slots": [
      {
        "t": "09:30",
        "title": "Apertura de zonas de público",
        "place": "Zonas A y B",
        "pin": "A"
      },
      {
        "t": "10:30",
        "title": "Clasificación",
        "place": "Salida",
        "pin": "S",
        "past": true
      },
      {
        "t": "15:00",
        "title": "Final",
        "place": "Salida · en vivo",
        "pin": "S",
        "now": true
      },
      {
        "t": "17:30",
        "title": "Premiación",
        "place": "Plaza · Meta",
        "pin": "M"
      }
    ]
  }
];

export const ACCESS: Access[] = [
  {
    "pin": "N",
    "title": "En transporte público",
    "text": "Por el acceso norte. Estación o paradero más cercano: por anunciar."
  },
  {
    "pin": "E",
    "title": "En auto",
    "text": "Por el acceso sur. Calles cerradas el día de la carrera; estacionamientos por anunciar."
  },
  {
    "pin": "A",
    "title": "Dónde ver la carrera",
    "text": "Zona A para ver saltos; zona B para ir en familia. Entrada: por anunciar."
  },
  {
    "pin": "M",
    "title": "Fan zone y tienda",
    "text": "En la meta: premiación, tienda oficial y retiro de compras en línea."
  }
];

export const POSTS: Post[] = [
  {
    "id": "c9",
    "type": "cronica",
    "race": "mzl",
    "title": "La ciudad de las pendientes recibe a la Copa",
    "dek": "Manizales abre la temporada el 9 de enero: por qué sus calles empinadas son un escenario natural para el descenso urbano.",
    "date": "10 nov 2026",
    "img": "/assets/img/escena-salto.svg",
    "pos": "60% 40%",
    "body": [
      "Texto de ejemplo. En Manizales, subir y bajar es parte de la rutina: la ciudad se extiende sobre laderas andinas y muchas de sus calles terminan en escaleras.",
      "El descenso urbano se parece poco a la montaña. No hay raíces ni barro; hay barandas, bordillos, cambios de textura y un público que se asoma desde los balcones.",
      "El trazado oficial de la Parada 01 se publicará antes de la carrera. Mientras tanto, la ficha de la sede muestra un trazado ilustrativo con el formato que tendrá el mapa.",
      "Esta crónica muestra el formato largo: tipografía de lectura, cita destacada y publicaciones relacionadas."
    ],
    "pull": "Aquí la pista no se construye: se descubre."
  },
  {
    "id": "c10",
    "type": "noticia",
    "race": "mzl",
    "title": "Cómo llegar a la Parada 01: movilidad y cierres de calles",
    "dek": "Accesos, zonas de público y recomendaciones para el 9 de enero (por anunciar).",
    "date": "10 nov 2026",
    "img": "/assets/img/escena-muro.svg",
    "pos": "30% 50%"
  },
  {
    "id": "c4",
    "type": "video",
    "race": "mzl",
    "title": "Reconocimiento en primera persona",
    "dek": "Una bajada de prueba con cámara en el casco.",
    "date": "09 nov 2026",
    "img": "/assets/img/escena-escalinata.svg",
    "pos": "70% 50%",
    "duration": "2:48"
  },
  {
    "id": "c3",
    "type": "galeria",
    "race": "mzl",
    "title": "Reconocimiento del trazado en Manizales",
    "dek": "El equipo de trazado probó barandas, rampas y escalinatas.",
    "date": "08 nov 2026",
    "img": "/assets/img/escena-muro.svg",
    "pos": "50% 40%",
    "n": 12
  },
  {
    "id": "c2",
    "type": "noticia",
    "race": "mzl",
    "title": "Primeros pilotos invitados para la Parada 01 en Manizales",
    "dek": "La organización confirma la lista inicial de invitados (perfiles de ejemplo).",
    "date": "06 nov 2026",
    "img": "/assets/img/escena-salto.svg",
    "pos": "40% 50%"
  },
  {
    "id": "c1",
    "type": "noticia",
    "race": "copa",
    "title": "Calendario 2027: Colombia, Perú y México",
    "dek": "La Copa arranca el 9 de enero en Manizales, sigue el 7 de febrero en Perú y cierra en marzo en México.",
    "date": "04 nov 2026",
    "img": "/assets/img/escena-escalinata.svg",
    "pos": "40% 50%",
    "featured": true
  },
  {
    "id": "c5",
    "type": "cronica",
    "race": "copa",
    "title": "Así se construye una pista en plena ciudad",
    "dek": "Barandas, rampas de madera y semanas de permisos: la trastienda de una carrera urbana.",
    "date": "02 nov 2026",
    "img": "/assets/img/escena-callejon.svg",
    "pos": "50% 60%",
    "pull": "La ciudad presta sus calles por un fin de semana."
  },
  {
    "id": "c6",
    "type": "noticia",
    "race": "per",
    "title": "Perú será la Parada 02: domingo 7 de febrero",
    "dek": "La ciudad sede se anunciará en las próximas semanas.",
    "date": "30 oct 2026",
    "img": "/assets/img/escena-callejon.svg",
    "pos": "40% 50%"
  },
  {
    "id": "c11",
    "type": "noticia",
    "race": "mex",
    "title": "México cerrará la temporada en marzo",
    "dek": "Ciudad y fecha exacta por anunciar.",
    "date": "29 oct 2026",
    "img": "/assets/img/escena-salto.svg",
    "pos": "60% 30%"
  },
  {
    "id": "c7",
    "type": "galeria",
    "race": "copa",
    "title": "Presentación oficial de la Copa",
    "dek": "Corredores, organizadores y aliados en el lanzamiento de la temporada.",
    "date": "28 oct 2026",
    "img": "/assets/img/escena-salto.svg",
    "pos": "70% 40%",
    "n": 8
  },
  {
    "id": "c8",
    "type": "video",
    "race": "copa",
    "title": "Teaser oficial de la temporada 2027",
    "dek": "Cuarenta y cinco segundos de lo que viene.",
    "date": "25 oct 2026",
    "img": "/assets/img/escena-muro.svg",
    "pos": "50% 30%",
    "duration": "0:45"
  }
];

export const PRODUCTS: Product[] = [
  {
    "id": "p5",
    "name": "Camiseta Edición Manizales",
    "col": "mzl",
    "type": "ropa",
    "price": 32,
    "kind": "tee",
    "print": "MZL\n01",
    "colors": [
      {
        "n": "Ladrillo",
        "h": "#A8432A"
      },
      {
        "n": "Asfalto",
        "h": "#1A1A1A"
      }
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "badge": "Edición limitada",
    "desc": "Camiseta conmemorativa de la Parada 01. Tiraje limitado."
  },
  {
    "id": "p6",
    "name": "Póster Parada 01 · Manizales",
    "col": "mzl",
    "type": "col",
    "price": 18,
    "kind": "poster",
    "print": "MANIZALES\n01",
    "colors": [
      {
        "n": "Papel hueso",
        "h": "#F2EEE6"
      }
    ],
    "sizes": [
      "50 × 70 cm"
    ],
    "badge": "Numerado",
    "desc": "Serigrafía a dos tintas con el mapa oficial del trazado (cuando se publique). Ejemplares numerados."
  },
  {
    "id": "p1",
    "name": "Camiseta oficial Copa 2027",
    "col": "copa",
    "type": "ropa",
    "price": 32,
    "kind": "tee",
    "print": "COPA\nDH 27",
    "colors": [
      {
        "n": "Asfalto",
        "h": "#1A1A1A"
      },
      {
        "n": "Señal",
        "h": "#FF5B1F"
      },
      {
        "n": "Hueso",
        "h": "#F2EEE6"
      }
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "desc": "La camiseta de la temporada, con las tres paradas en la espalda."
  },
  {
    "id": "p7",
    "name": "Calcetines Edición Manizales",
    "col": "mzl",
    "type": "acc",
    "price": 12,
    "kind": "socks",
    "print": "",
    "colors": [
      {
        "n": "Ladrillo",
        "h": "#A8432A"
      }
    ],
    "sizes": [
      "S/M",
      "L/XL"
    ],
    "soldOut": true,
    "badge": "Agotado",
    "desc": "Calcetines técnicos de la edición Manizales."
  },
  {
    "id": "p2",
    "name": "Jersey técnico manga larga",
    "col": "copa",
    "type": "ropa",
    "price": 58,
    "kind": "longsleeve",
    "print": "DH\nLATAM",
    "colors": [
      {
        "n": "Asfalto",
        "h": "#1A1A1A"
      },
      {
        "n": "Señal",
        "h": "#FF5B1F"
      }
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "desc": "Jersey de descenso de secado rápido, corte holgado."
  },
  {
    "id": "p3",
    "name": "Gorra Copa 2027",
    "col": "copa",
    "type": "acc",
    "price": 24,
    "kind": "cap",
    "print": "DH",
    "colors": [
      {
        "n": "Asfalto",
        "h": "#1A1A1A"
      },
      {
        "n": "Hueso",
        "h": "#F2EEE6"
      },
      {
        "n": "Señal",
        "h": "#FF5B1F"
      }
    ],
    "sizes": [
      "Única"
    ],
    "desc": "Gorra de cinco paneles con bordado frontal."
  },
  {
    "id": "p4",
    "name": "Guantes de descenso",
    "col": "copa",
    "type": "acc",
    "price": 26,
    "kind": "gloves",
    "print": "",
    "colors": [
      {
        "n": "Asfalto",
        "h": "#1A1A1A"
      },
      {
        "n": "Señal",
        "h": "#FF5B1F"
      }
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "desc": "Guantes de dedo completo con palma reforzada."
  },
  {
    "id": "p8",
    "name": "Hoodie Edición Perú",
    "col": "per",
    "type": "ropa",
    "price": 54,
    "kind": "hoodie",
    "print": "PER\n02",
    "colors": [
      {
        "n": "Añil",
        "h": "#2B3A67"
      },
      {
        "n": "Asfalto",
        "h": "#1A1A1A"
      }
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "badge": "Preventa",
    "desc": "Sudadera de la Parada 02. Preventa: se entrega en la sede (ciudad por anunciar)."
  }
];

export const RIDERS: Rider[] = [
  {
    "id": "r1",
    "name": "Camila Restrepo",
    "cc": "CO",
    "country": "Colombia",
    "plate": "07",
    "races": [
      "mzl",
      "per"
    ],
    "bg": "#FF5B1F",
    "fg": "#121212",
    "desc": "Especialista en escaleras largas. Podio nacional de descenso urbano.",
    "team": "Por confirmar",
    "feat": "Podio en el campeonato nacional (dato de ejemplo).",
    "career": "Descenso desde juvenil; enfocada en carreras urbanas.",
    "category": "Élite Mujeres"
  },
  {
    "id": "r2",
    "name": "Mateo Quispe",
    "cc": "PE",
    "country": "Perú",
    "plate": "21",
    "races": [
      "mzl",
      "per"
    ],
    "bg": "#2A2A2A",
    "fg": "#FF5B1F",
    "desc": "Corre en casa la Parada 02. Rápido en callejones estrechos.",
    "team": "Por confirmar",
    "feat": "",
    "career": "Enduro y descenso en los Andes peruanos.",
    "category": "Élite Hombres"
  },
  {
    "id": "r3",
    "name": "Valentina Ortiz",
    "cc": "MX",
    "country": "México",
    "plate": "13",
    "races": [
      "mzl"
    ],
    "bg": "#ECE8E0",
    "fg": "#121212",
    "desc": "Técnica en drops y saltos de madera.",
    "team": "Equipo de ejemplo",
    "feat": "Ganadora de una fecha regional (dato de ejemplo).",
    "career": "",
    "category": "Élite Mujeres"
  },
  {
    "id": "r4",
    "name": "Santiago Muñoz",
    "cc": "CL",
    "country": "Chile",
    "plate": "03",
    "races": [
      "mzl",
      "per"
    ],
    "bg": "#1A1A1A",
    "fg": "#ECE8E0",
    "desc": "Veterano del descenso urbano sudamericano.",
    "team": "Por confirmar",
    "feat": "Más de diez carreras urbanas disputadas (dato de ejemplo).",
    "career": "Pasó del descenso en montaña a las carreras en ciudad.",
    "category": "Élite Hombres"
  },
  {
    "id": "r5",
    "name": "Lucía Ferreyra",
    "cc": "AR",
    "country": "Argentina",
    "plate": "18",
    "races": [
      "mzl"
    ],
    "bg": "#A8432A",
    "fg": "#F2EFE9",
    "desc": "Debuta en la Copa tras una temporada fuerte en su país.",
    "team": "",
    "feat": "",
    "career": "",
    "category": "Élite Mujeres"
  },
  {
    "id": "r6",
    "name": "Diego Cardona",
    "cc": "CO",
    "country": "Colombia",
    "plate": "01",
    "races": [
      "mzl",
      "per"
    ],
    "bg": "#FF5B1F",
    "fg": "#2A2A2A",
    "desc": "Local en Manizales. Conoce cada pendiente de la ciudad.",
    "team": "Equipo de ejemplo",
    "feat": "Récord de pista local (dato de ejemplo).",
    "career": "Creció corriendo en las calles empinadas de su ciudad.",
    "category": "Élite Hombres"
  },
  {
    "id": "r7",
    "name": "Rafael Souza",
    "cc": "BR",
    "country": "Brasil",
    "plate": "44",
    "races": [
      "per"
    ],
    "bg": "#2B3A67",
    "fg": "#F2EFE9",
    "desc": "Velocidad pura en tramos de asfalto.",
    "team": "Por confirmar",
    "feat": "",
    "career": "",
    "category": "Élite Hombres"
  },
  {
    "id": "r8",
    "name": "Andrés Vera",
    "cc": "EC",
    "country": "Ecuador",
    "plate": "09",
    "races": [
      "mzl"
    ],
    "bg": "#ECE8E0",
    "fg": "#A8432A",
    "desc": "Joven promesa invitada a su primera Copa.",
    "team": "",
    "feat": "",
    "career": "Categoría juvenil hasta 2026.",
    "category": "Junior"
  }
];

export const GENERIC_BODY: string[] = [
  "Texto de ejemplo. Aquí va el cuerpo de la publicación, que la organización escribe y edita desde el panel de administración: puede guardarla como borrador, elegir una portada y publicarla o programarla.",
  "Cada publicación se asocia a una carrera o a la Copa en general. Con eso aparece sola en la ficha de la sede correspondiente, sin cargarla dos veces.",
  "Los datos pendientes se muestran como «Por anunciar» hasta que el organizador los confirme."
];

export const CAPTIONS: string[] = [
  "Reconocimiento de la Sección 1",
  "Prueba de barandas en la escalinata",
  "Montaje de la rampa",
  "El equipo de trazado mide el drop",
  "Vista desde la zona de público A",
  "Atardecer sobre la meta"
];

export const CREDITS: string[] = [
  "Portada, tarjetas y galerías: ilustraciones provisionales hechas para este prototipo. Se reemplazan por fotografía con licencia; cada foto llevará aquí su autor, licencia y enlace de origen.",
  "Fotos de otras competencias o ciudades se marcarán como «Imagen de referencia».",
  "Productos: siluetas ilustrativas."
];

