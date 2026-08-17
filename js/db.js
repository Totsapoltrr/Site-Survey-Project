/**
 * db.js - IndexedDB Database Manager for Site Survey Projects
 */
const DB_NAME = "SiteSurveyDB_Clean";
const DB_VERSION = 1;
const STORE_NAME = "surveys";

class SurveyDB {
  constructor() {
    this.db = null;
    this.isReady = this.init();
  }

  async init() {
    if (!window.indexedDB) {
      console.warn("IndexedDB not supported, using localStorage fallback");
      return null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
          store.createIndex("projectName", "fields.projectName", { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getAll() {
    await this.isReady;
    if (!this.db) return this._fallbackGetAll();

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        results.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getById(id) {
    await this.isReady;
    if (!this.db) return this._fallbackGetById(id);

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async save(survey) {
    await this.isReady;
    const now = new Date().toISOString();

    if (!survey.id) {
      survey.id = "srv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
      survey.createdAt = now;
    }
    survey.updatedAt = now;

    if (!this.db) return this._fallbackSave(survey);

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(survey);

      request.onsuccess = () => resolve(survey);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id) {
    await this.isReady;
    if (!this.db) return this._fallbackDelete(id);

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async duplicate(id) {
    const original = await this.getById(id);
    if (!original) throw new Error("Item not found");

    const copy = JSON.parse(JSON.stringify(original));
    copy.id = "srv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = copy.createdAt;

    if (copy.fields && copy.fields.projectName) {
      copy.fields.projectName += " (สำเนา)";
    }

    return await this.save(copy);
  }

  async exportAll() {
    const all = await this.getAll();
    return JSON.stringify({
      version: "2.0",
      exportDate: new Date().toISOString(),
      surveys: all
    }, null, 2);
  }

  async importAll(jsonStr) {
    const data = JSON.parse(jsonStr);
    const surveys = Array.isArray(data) ? data : (data.surveys || []);
    let count = 0;

    for (const survey of surveys) {
      if (survey && survey.fields) {
        if (!survey.id) {
          survey.id = "srv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
        }
        await this.save(survey);
        count++;
      }
    }
    return count;
  }

  _fallbackGetAll() {
    try {
      const raw = localStorage.getItem("survey_clean_records");
      const items = raw ? JSON.parse(raw) : [];
      return items.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    } catch(e) { return []; }
  }

  _fallbackGetById(id) {
    const items = this._fallbackGetAll();
    return items.find(i => i.id === id) || null;
  }

  _fallbackSave(survey) {
    const items = this._fallbackGetAll();
    const idx = items.findIndex(i => i.id === survey.id);
    if (idx >= 0) items[idx] = survey;
    else items.push(survey);
    try { localStorage.setItem("survey_clean_records", JSON.stringify(items)); } catch(e) {}
    return survey;
  }

  _fallbackDelete(id) {
    let items = this._fallbackGetAll();
    items = items.filter(i => i.id !== id);
    try { localStorage.setItem("survey_clean_records", JSON.stringify(items)); } catch(e) {}
    return true;
  }
}

window.db = new SurveyDB();
