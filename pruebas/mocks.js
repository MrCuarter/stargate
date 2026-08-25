'use strict';
/**
 * STARGATE · Banco de pruebas — Google simulado
 * ---------------------------------------------
 * Ejecuta el Code.gs DE VERDAD fuera de Google: hojas en memoria, Drive, Docs, correo,
 * propiedades, cerrojo y triggers. No sustituye a la prueba en vivo, pero coge los fallos
 * de lógica en segundos y sin gastar cuota.
 *
 * Un dato, un sitio: aquí NO se copia nada de Code.gs. Se carga el fichero real.
 */

// ---------------------------------------------------------------- utilidades
const copia = v => (v instanceof Date ? new Date(v.getTime()) : v);
const vacio = v => v === "" || v === null || v === undefined;
function iterador(lista) {
  let i = 0;
  return { hasNext: () => i < lista.length, next: () => lista[i++] };
}

// ---------------------------------------------------------------- reloj congelable
const reloj = { ahora: new Date("2026-08-25T12:00:00Z") };
const RealDate = Date;
class FakeDate extends RealDate {
  constructor(...a) { if (a.length === 0) super(reloj.ahora.getTime()); else super(...a); }
  static now() { return reloj.ahora.getTime(); }
}

// ---------------------------------------------------------------- Sheets
class Rango {
  constructor(h, f, c, nf, nc) { this.h = h; this.f = f; this.c = c; this.nf = nf; this.nc = nc; }
  getRow() { return this.f; }
  getColumn() { return this.c; }
  getNumRows() { return this.nf; }
  getNumColumns() { return this.nc; }
  getSheet() { return this.h; }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nf; i++) {
      const fila = this.h._fila(this.f - 1 + i), r = [];
      for (let j = 0; j < this.nc; j++) { const v = fila[this.c - 1 + j]; r.push(copia(v === undefined ? "" : v)); }
      out.push(r);
    }
    return out;
  }
  getValue() { return this.getValues()[0][0]; }
  setValues(vals) { vals.forEach((r, i) => r.forEach((v, j) => this.h._set(this.f - 1 + i, this.c - 1 + j, v))); return this; }
  setValue(v) { for (let i = 0; i < this.nf; i++) for (let j = 0; j < this.nc; j++) this.h._set(this.f - 1 + i, this.c - 1 + j, v); return this; }
  clearContent() { return this.setValue(""); }
  setFontWeight() { return this; } setFontSize() { return this; } setBackground() { return this; }
  setFontColor() { return this; } setFontStyle() { return this; } setNumberFormat() { return this; }
  setWrap() { return this; } setHorizontalAlignment() { return this; } setNote() { return this; }
}

class Hoja {
  constructor(libro, nombre) {
    this.libro = libro; this.nombre = nombre; this.datos = [];
    this.color = ""; this.oculta = false; this._formUrl = ""; this.congeladas = 0;
  }
  getName() { return this.nombre; }
  setName(n) {
    const otra = this.libro.getSheetByName(n);
    if (otra && otra !== this) throw new Error('Ya existe una hoja llamada "' + n + '"');
    this.nombre = n; return this;
  }
  _fila(i) { if (!this.datos[i]) this.datos[i] = []; return this.datos[i]; }
  _set(i, j, v) { const f = this._fila(i); while (f.length <= j) f.push(""); f[j] = v; }
  getLastRow() { let u = 0; this.datos.forEach((f, i) => { if (f && f.some(x => !vacio(x))) u = i + 1; }); return u; }
  getLastColumn() {
    let u = 0;
    this.datos.forEach(f => { if (!f) return; for (let j = f.length - 1; j >= 0; j--) if (!vacio(f[j])) { if (j + 1 > u) u = j + 1; break; } });
    return u;
  }
  getMaxRows() { return Math.max(this.getLastRow(), 1000); }
  getMaxColumns() { return Math.max(this.getLastColumn(), 26); }
  getRange(f, c, nf, nc) { return new Rango(this, f, c, nf === undefined ? 1 : nf, nc === undefined ? 1 : nc); }
  getDataRange() { return new Rango(this, 1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1)); }
  appendRow(v) { this.datos.push((v || []).slice()); return this; }
  deleteRow(i) { this.datos.splice(i - 1, 1); return this; }
  clear() { this.datos = []; return this; }
  clearContents() { this.datos = []; return this; }
  setFrozenRows(n) { this.congeladas = n; return this; }
  setFrozenColumns() { return this; }
  setTabColor(c) { this.color = c; return this; }
  hideSheet() { this.oculta = true; return this; }
  showSheet() { this.oculta = false; return this; }
  autoResizeColumn() { return this; }
  setColumnWidth() { return this; }
  getFormUrl() { return this._formUrl || null; }
}

class Libro {
  constructor(nombre, id) {
    this.nombre = nombre; this.id = id || ("ss_" + (++Libro.n)); this.hojas = [];
    Libro.registro[this.id] = this;
  }
  getId() { return this.id; }
  getName() { return this.nombre; }
  getUrl() { return "https://docs.google.com/spreadsheets/d/" + this.id + "/edit"; }
  getOwner() { return { getEmail: () => Libro.propietario }; }
  getSheets() { return this.hojas.slice(); }
  getSheetByName(n) { return this.hojas.filter(h => h.nombre === n)[0] || null; }
  insertSheet(n) {
    const h = new Hoja(this, n || ("Hoja " + (this.hojas.length + 1)));
    if (n && this.getSheetByName(n)) throw new Error('Ya existe una hoja llamada "' + n + '"');
    this.hojas.push(h); return h;
  }
  deleteSheet(h) {
    const i = this.hojas.indexOf(h);
    if (i < 0) throw new Error("Esa hoja no está en el libro");
    if (this.hojas.length < 2) throw new Error("No se puede eliminar la única hoja del libro");
    this.hojas.splice(i, 1);
  }
  setActiveSheet(h) { this._activa = h; return h; }
  getActiveSheet() { return this._activa || this.hojas[0]; }
  moveActiveSheet(pos) { const h = this.getActiveSheet(); const i = this.hojas.indexOf(h); if (i >= 0) { this.hojas.splice(i, 1); this.hojas.splice(pos - 1, 0, h); } }
  getActiveRange() { return this._rango || this.getActiveSheet().getRange(1, 1); }
}
Libro.n = 0; Libro.registro = {}; Libro.propietario = "mutecdgami@gmail.com";

// ---------------------------------------------------------------- interfaz de usuario (scriptable)
const UI = {
  ButtonSet: { OK: "OK", OK_CANCEL: "OK_CANCEL", YES_NO: "YES_NO" },
  Button: { OK: "OK", CANCEL: "CANCEL", YES: "YES", NO: "NO", CLOSE: "CLOSE" },
  avisos: [], preguntas: [], cola: [],
  responder(...rs) { rs.forEach(r => this.cola.push(r)); return this; },
  _siguiente(porDefecto) { return this.cola.length ? this.cola.shift() : porDefecto; },
  alert(...a) {
    const ultimo = a[a.length - 1];
    const conBotones = a.length >= 2 && ["OK", "OK_CANCEL", "YES_NO"].indexOf(ultimo) >= 0;
    this.avisos.push(a.filter(x => typeof x === "string" && ["OK", "OK_CANCEL", "YES_NO"].indexOf(x) < 0).join(" :: "));
    if (!conBotones) return this.Button.OK;
    const r = this._siguiente(ultimo === "YES_NO" ? this.Button.YES : this.Button.OK);
    return typeof r === "string" ? r : (r.boton || this.Button.OK);
  },
  prompt(...a) {
    this.preguntas.push(a.filter(x => typeof x === "string").join(" :: "));
    const r = this._siguiente({ boton: this.Button.OK, texto: "" });
    const o = typeof r === "string" ? { boton: this.Button.OK, texto: r } : r;
    return { getSelectedButton: () => o.boton || UI.Button.OK, getResponseText: () => o.texto || "" };
  },
  createMenu(t) {
    const m = { _t: t, _items: [], addItem(a, b) { m._items.push([a, b]); return m; }, addSeparator() { return m; },
                addSubMenu(s) { m._items.push(["sub", s]); return m; }, addToUi() { UI.menu = m; return m; } };
    return m;
  },
  showModalDialog(html, titulo) { this.dialogos = this.dialogos || []; this.dialogos.push(titulo); },
  showSidebar() {},
  limpiar() { this.avisos = []; this.preguntas = []; this.cola = []; this.dialogos = []; }
};

// ---------------------------------------------------------------- Drive
class Archivo {
  constructor(id, nombre, mime, carpeta) { this.id = id; this.nombre = nombre; this.mime = mime; this.carpeta = carpeta || null; this.papelera = false; Drive._archivos[id] = this; }
  getId() { return this.id; }
  getName() { return this.nombre; }
  setName(n) { this.nombre = n; return this; }
  getMimeType() { return this.mime; }
  getUrl() { return "https://drive.google.com/file/d/" + this.id; }
  getParents() { return iterador(this.carpeta ? [this.carpeta] : []); }
  moveTo(c) { if (this.carpeta) this.carpeta._quitar(this); this.carpeta = c; c._meter(this); return this; }
  setTrashed(b) { this.papelera = !!b; if (b && this.carpeta) this.carpeta._quitar(this); return this; }
  makeCopy(nombre, carpeta) {
    const n = new Archivo("f_" + (++Drive._n), nombre, this.mime, carpeta || this.carpeta);
    if (n.carpeta) n.carpeta._meter(n);
    if (this._form) n._form = this._form._copiar(n.id, nombre);
    return n;
  }
}
class Carpeta {
  constructor(id, nombre, padre) { this.id = id; this.nombre = nombre; this.padre = padre || null; this.hijos = []; this.archivos = []; this.papelera = false; Drive._carpetas[id] = this; }
  getId() { return this.id; }
  getName() { return this.nombre; }
  createFolder(n) { const c = new Carpeta("c_" + (++Drive._n), n, this); this.hijos.push(c); return c; }
  getFolders() { return iterador(this.hijos.filter(c => !c.papelera)); }
  getFoldersByName(n) { return iterador(this.hijos.filter(c => !c.papelera && c.nombre === n)); }
  getFiles() { return iterador(this.archivos.filter(a => !a.papelera)); }
  getFilesByName(n) { return iterador(this.archivos.filter(a => !a.papelera && a.nombre === n)); }
  getFilesByType(m) { return iterador(this.archivos.filter(a => !a.papelera && a.mime === m)); }
  setTrashed(b) { this.papelera = !!b; if (b && this.padre) this.padre.hijos = this.padre.hijos.filter(c => c !== this); return this; }
  _meter(a) { if (this.archivos.indexOf(a) < 0) this.archivos.push(a); }
  _quitar(a) { this.archivos = this.archivos.filter(x => x !== a); }
}
const Drive = {
  _archivos: {}, _carpetas: {}, _n: 0, raiz: null,
  getRootFolder() { return Drive.raiz; },
  getFileById(id) { const a = Drive._archivos[id]; if (!a) throw new Error("No se ha encontrado el archivo con id " + id); return a; },
  getFolderById(id) { const c = Drive._carpetas[id]; if (!c) throw new Error("No se ha encontrado la carpeta " + id); return c; },
  getFilesByName(n) { return iterador(Object.keys(Drive._archivos).map(k => Drive._archivos[k]).filter(a => !a.papelera && a.nombre === n)); },
  createFolder(n) { return Drive.raiz.createFolder(n); }
};

// ---------------------------------------------------------------- Docs
class Parrafo {
  constructor(texto) { this.texto = texto; this.enlaces = []; }
  setHeading(h) { this.heading = h; return this; }
  setItalic() { return this; } setBold() { return this; }
  appendText(t) { this.texto += t; this._ultimo = t; return this; }
  setLinkUrl(u) { this.enlaces.push(u); return this; }
  editAsText() { return { setFontFamily: () => ({ setFontSize: () => ({ setBackgroundColor: () => ({}) }) }), setBackgroundColor: () => ({}), setFontSize: () => ({}) }; }
  setAttributes() { return this; }
}
class Cuerpo {
  constructor() { this.parrafos = []; }
  setMarginTop() { return this; }
  appendParagraph(t) { const p = new Parrafo(String(t)); this.parrafos.push(p); return p; }
  appendImage() { this.parrafos.push(new Parrafo("[imagen]")); return this.parrafos[this.parrafos.length - 1]; }
  appendHorizontalRule() { this.parrafos.push(new Parrafo("---")); return this; }
  appendListItem(t) { const p = new Parrafo("· " + t); this.parrafos.push(p); p.setGlyphType = () => p; p.setNestingLevel = () => p; return p; }
  appendPageBreak() { this.parrafos.push(new Parrafo("\f")); return this; }
  clear() { this.parrafos = []; return this; }
  appendTable(filas) {
    const t = { filas: filas || [], setBorderColor: () => t, getRow: i => ({ getCell: j => ({ setText: () => {}, getText: () => String((filas[i]||[])[j]||"") }) }), getNumRows: () => (filas||[]).length };
    (filas || []).forEach(f => this.parrafos.push(new Parrafo(f.join(" | "))));
    this.tablas = this.tablas || []; this.tablas.push(t);
    return t;
  }
  getText() { return this.parrafos.map(p => p.texto).join("\n"); }
}
class Documento {
  constructor(nombre) {
    this.id = "doc_" + (++Drive._n); this.nombre = nombre; this.cuerpo = new Cuerpo();
    this.archivo = new Archivo(this.id, nombre, "application/vnd.google-apps.document", null);
    Documento.registro[this.id] = this;
  }
  getId() { return this.id; }
  getBody() { return this.cuerpo; }
  getUrl() { return "https://docs.google.com/document/d/" + this.id + "/edit"; }
  getName() { return this.nombre; }
  saveAndClose() { this.cerrado = true; }
  addEditor() { return this; } addViewer() { return this; }
}
Documento.registro = {};
const Docs = {
  create(n) { return new Documento(n); },
  openById(id) { const d = Documento.registro[id]; if (!d) throw new Error("documento no encontrado"); return d; },
  ParagraphHeading: { HEADING1: "H1", HEADING2: "H2", HEADING3: "H3", NORMAL: "N", TITLE: "T" },
  Attribute: {}, ElementType: {}, HorizontalAlignment: {}
};

// ---------------------------------------------------------------- resto de servicios
const Props = (() => {
  const mapas = {};
  const hacer = k => {
    mapas[k] = mapas[k] || {};
    const m = mapas[k];
    return { getProperty: p => (p in m ? m[p] : null), setProperty: (p, v) => { m[p] = String(v); return this; },
             deleteProperty: p => { delete m[p]; }, getProperties: () => Object.assign({}, m),
             setProperties: o => { Object.assign(m, o); }, deleteAllProperties: () => { Object.keys(m).forEach(x => delete m[x]); } };
  };
  return { getScriptProperties: () => hacer("script"), getUserProperties: () => hacer("user"),
           getDocumentProperties: () => hacer("doc"), _mapas: mapas };
})();

const Correo = {
  enviados: [],
  sendEmail(a, b, c) {
    if (typeof a === "object") Correo.enviados.push({ para: a.to, asunto: a.subject, cuerpo: a.body || a.htmlBody || "" });
    else Correo.enviados.push({ para: a, asunto: b, cuerpo: c });
  },
  getRemainingDailyQuota() { return 1500; },
  limpiar() { Correo.enviados = []; },
  paraQuien(fragmento) { return Correo.enviados.filter(e => String(e.para).indexOf(fragmento) >= 0); }
};

const Cerrojo = {
  _tomado: false, veces: 0,
  getDocumentLock() { return Cerrojo._obj(); }, getScriptLock() { return Cerrojo._obj(); },
  _obj() {
    return {
      waitLock(ms) { if (Cerrojo._tomado) throw new Error("No se ha podido obtener el cerrojo"); Cerrojo._tomado = true; Cerrojo.veces++; },
      tryLock() { if (Cerrojo._tomado) return false; Cerrojo._tomado = true; return true; },
      releaseLock() { Cerrojo._tomado = false; },
      hasLock() { return Cerrojo._tomado; }
    };
  }
};

const Utils = {
  formatDate(d, tz, fmt) {
    const f = d instanceof RealDate ? d : new RealDate(d);
    const p = (n, l) => String(n).padStart(l || 2, "0");
    return String(fmt)
      .replace(/yyyy/g, f.getFullYear()).replace(/MM/g, p(f.getMonth() + 1))
      .replace(/dd/g, p(f.getDate())).replace(/HH/g, p(f.getHours()))
      .replace(/mm/g, p(f.getMinutes())).replace(/ss/g, p(f.getSeconds()));
  },
  getUuid() { return "uuid-" + (++Utils._n); }, _n: 0,
  sleep() {},
  base64Encode: s => Buffer.from(String(s)).toString("base64"),
  newBlob: (c, t, n) => ({ getBytes: () => [], getContentType: () => t, getName: () => n, getDataAsString: () => String(c) })
};

const Guiones = {
  _triggers: [],
  getProjectTriggers() { return Guiones._triggers.slice(); },
  deleteTrigger(t) { Guiones._triggers = Guiones._triggers.filter(x => x !== t); },
  newTrigger(fn) {
    const t = { fn, uid: "trg_" + (++Utils._n), tipo: "", hora: null,
                getHandlerFunction: () => t.fn, getUniqueId: () => t.uid, getEventType: () => t.tipo };
    const constructor = {
      forSpreadsheet() { t.tipo = "hoja"; return constructor; },
      timeBased() { t.tipo = "tiempo"; return constructor; },
      onFormSubmit() { t.evento = "formSubmit"; return constructor; },
      onEdit() { t.evento = "edit"; return constructor; },
      atHour(h) { t.hora = h; return constructor; },
      everyDays(n) { t.dias = n; return constructor; },
      at(f) { t.fecha = f; return constructor; },
      after(ms) { t.despues = ms; return constructor; },
      everyMinutes(n) { t.minutos = n; return constructor; },
      create() { Guiones._triggers.push(t); return t; }
    };
    return constructor;
  }
};

const Contenido = {
  MimeType: { JSON: "application/json", TEXT: "text/plain" },
  createTextOutput(t) { const o = { _t: t, setMimeType() { return o; }, getContent: () => o._t }; return o; }
};
const Html = {
  createHtmlOutput(h) { const o = { _h: h, setWidth() { return o; }, setHeight() { return o; }, setTitle() { return o; }, getContent: () => o._h }; return o; },
  createHtmlOutputFromFile(n) { return Html.createHtmlOutput("<!-- " + n + " -->"); }
};
const Fetch = {
  llamadas: [],
  fetch(url) {
    Fetch.llamadas.push(url);
    return { getBlob: () => ({ getName: () => "blob", getContentType: () => "image/png", setName() { return this; } }),
             getContentText: () => "", getResponseCode: () => 200 };
  }
};
const Mimes = {
  GOOGLE_FORMS: "application/vnd.google-apps.form",
  GOOGLE_SHEETS: "application/vnd.google-apps.spreadsheet",
  GOOGLE_DOCS: "application/vnd.google-apps.document",
  FOLDER: "application/vnd.google-apps.folder", PDF: "application/pdf", PNG: "image/png"
};
const Sesion = {
  getActiveUser: () => ({ getEmail: () => "mutecdgami@gmail.com" }),
  getEffectiveUser: () => ({ getEmail: () => "mutecdgami@gmail.com" }),
  getScriptTimeZone: () => "Europe/Madrid"
};

module.exports = { Rango, Hoja, Libro, UI, Archivo, Carpeta, Drive, Docs, Documento,
                   Props, Correo, Cerrojo, Utils, Guiones, Contenido, Html, Fetch, Mimes,
                   Sesion, reloj, FakeDate, RealDate, iterador };
