// DATOS DE EJEMPLO para ver la sala «como en clase» sin servidor: una tripulación de 22 reclutas, los otros grupos del
// curso (el Salón de la fama) y la Galería de juegos. Siempre los mismos (semilla fija). En la web esto lo da el servidor
// (stargateSala: ranking y galería) y este fichero NO se usa.
import { JUEGOS, estado, galeria } from './comun.js?v=462150c228';

export const EN_WEB = location.pathname.includes('/juegos/');
export const AV = (k) => (EN_WEB ? '../../assets/img/avatares/evo/' : 'img/av/') + k + '.jpg';
let semilla = 20261005;
const rnd = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
const ALIAS = ['Rigel', 'Altair', 'Sirio', 'Antares', 'Deneb', 'Mizar', 'Alcor', 'Capella', 'Bellatrix', 'Procyon', 'Canopus', 'Spica',
  'Pollux', 'Castor', 'Regulus', 'Achernar', 'Hadar', 'Nyra', 'Lumen', 'Iskra', 'Elyra', 'Kestra'];
const OTROS = ['Tavek', 'Sable', 'Vexa', 'Orrin', 'Soren', 'Rhiane', 'Arken', 'Thaen', 'Vireo', 'Nael', 'Ravel', 'Sidra', 'Yara',
  'Zephir', 'Brask', 'Caldon', 'Faelan', 'Halcyon', 'Kyra', 'Maren', 'Noctis', 'Oryx', 'Perrin', 'Rhea', 'Sorrel', 'Tyrian', 'Vaela',
  'Ylva', 'Zorin', 'Amaris', 'Bryn', 'Calen', 'Fenn', 'Galen', 'Ione', 'Jaro', 'Loren', 'Mirren', 'Oriel', 'Quen'];
const avatar = () => `p${1 + Math.floor(rnd() * 7)}${rnd() < 0.5 ? 'f' : 'm'}_r${1 + Math.floor(rnd() * 4)}`;
// marca de ejemplo de cada máquina: la mayoría entre el bronce y la plata, pocos en el oro, alguno sin jugar
function marcas() {
  const m = {};
  for (const j of JUEGOS) { const r = rnd(); if (r < 0.18) continue; m[j.id] = Math.round((j.hitos[0] * 0.5 + rnd() * rnd() * j.hitos[2] * 1.25) / 10) * 10; }
  return m;
}
export const CLASE = ALIAS.map((alias) => ({ alias, avatar: avatar(), marcas: marcas() }));
const FAMA = OTROS.map((alias, i) => ({ alias, avatar: avatar(), grupo: 'Otro grupo', marcas: marcas() }));

// el ranking de una máquina: el de tu clase (con tus marcas) y el del curso entero (solo alias: ni nombres ni grupo)
export function ranking(juego, cual = 'clase') {
  const e = estado(), yo = { alias: e.alias, avatar: e.avatarNave || 'p3f_r2', marcas: e.marcas, yo: true };
  const lista = (cual === 'clase' ? [...CLASE, yo] : [...CLASE, ...FAMA, yo]).filter((p) => p.marcas[juego])
    .map((p) => ({ alias: p.alias, avatar: p.avatar, puntos: p.marcas[juego], yo: !!p.yo })).sort((a, b) => b.puntos - a.puntos);
  return cual === 'clase' ? lista : lista.slice(0, 10).concat(lista.slice(10).filter((p) => p.yo));
}

// LA GALERÍA: el reto principal del tema 6 («El juego») que cada recluta decide enseñar. Nadie sale sin querer.
const HERR = ['Genially', 'Wordwall', 'Educaplay', 'Genially', 'Kahoot!', 'Genially', 'Scratch', 'Educaplay', 'Wordwall'];
const TITULOS = [
  ['El laboratorio del tiempo', 'Escape room de Historia para 2.º de ESO: cuatro épocas, cuatro candados.'],
  ['Fracciones a bordo', 'Tres niveles de fracciones con una nave que se repara al acertar. 5.º de Primaria.'],
  ['Misión fotosíntesis', 'Un juego de pistas sobre la fotosíntesis, con modo por equipos. Biología, 1.º de ESO.'],
  ['La isla de los verbos', 'Tres islas, tres tiempos verbales: Inglés para 6.º de Primaria.'],
  ['Quién mató a la tilde', 'Misterio ortográfico con varias formas de jugar: solo o en parejas.'],
  ['Ruta por el Sistema Solar', 'Tablero digital: cada planeta es una casilla con una prueba. Ciencias, 3.º de Primaria.'],
  ['Mercado de ecuaciones', 'Compra y vende con ecuaciones de primer grado. Matemáticas, 2.º de ESO.'],
  ['Viaje al interior del cuerpo', 'Aventura por el aparato circulatorio en tres niveles.'],
  ['Quijote: la partida', 'Rol por capítulos para Lengua de 4.º de ESO.'],
];
export const JUEGOS_GALERIA = TITULOS.map(([t, d], i) => {
  const votos = Array.from({ length: 3 + Math.floor(rnd() * 12) }, () => Math.min(5, Math.max(1, Math.round(2.6 + rnd() * 2.6))));
  return { id: 'g' + (i + 1), alias: ALIAS[(i * 3 + 1) % ALIAS.length], avatar: CLASE[(i * 3 + 1) % ALIAS.length].avatar, titulo: t, desc: d, herr: HERR[i], url: '', votos };
});
// la media que ordena la galería: con pocos votos, se acerca a la media de todos (una sola estrella no hunde a nadie,
// ni un solo cinco encumbra)
export function nota(votos) { const k = 3, base = 3.5; return (votos.reduce((a, b) => a + b, 0) + k * base) / (votos.length + k); }
export function juegosGaleria() {
  const g = galeria(), e = estado();
  const lista = JUEGOS_GALERIA.map((j) => ({ ...j, votos: g.votos[j.id] ? [...j.votos, g.votos[j.id]] : j.votos, miVoto: g.votos[j.id] || 0 }));
  if (g.mio) lista.push({ id: 'mio', alias: e.alias, avatar: e.avatarNave || 'p3f_r2', ...g.mio, votos: [], mio: true });
  return lista;
}
