/**
 * db.js - Hybrid Database Manager (Firebase Cloud Database + IndexedDB Offline Cache)
 */
const DB_NAME = "SiteSurveyDB_Clean";
const DB_VERSION = 1;
const STORE_NAME = "surveys";

class SurveyDB {
  constructor() {
    this.localDB = null;
    this.firebaseDB = null;
    this.isCloudEnabled = false;
    this.listeners = [];
    this.isReady = this.init();
  }

  async init() {
    // 1. Initialize local IndexedDB first
    await this.initLocalDB();

    // 2. Check for Firebase configuration
    await this.initFirebase();

    return true;
  }

  async initLocalDB() {
    if (!window.indexedDB) return null;
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }
      };
      request.onsuccess = (event) => {
        this.localDB = event.target.result;
        resolve(this.localDB);
      };
      request.onerror = () => resolve(null);
    });
  }

  async initFirebase() {
    let config = window.FIREBASE_CONFIG;

    // Check if user set custom config in localStorage
    try {
      const savedConfig = localStorage.getItem("firebase_custom_config");
      if (savedConfig) {
        config = JSON.parse(savedConfig);
      }
    } catch(e) {}

    if (config && config.apiKey && config.databaseURL && typeof firebase !== "undefined") {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(config);
        }
        this.firebaseDB = firebase.database();
        this.isCloudEnabled = true;
        console.log("☁️ Connected to Firebase Cloud Database");

        // Listen for realtime cloud updates
        this.firebaseDB.ref("surveys").on("value", async (snapshot) => {
          const cloudData = snapshot.val() || {};
          const list = Object.values(cloudData);
          // Sync cloud records into local IndexedDB
          for (const item of list) {
            await this._saveLocal(item);
          }
          // Notify app listeners
          this.notifyListeners(list);
        });
      } catch (err) {
        console.warn("Firebase init error:", err);
      }
    }
  }

  onSurveysChanged(callback) {
    if (typeof callback === "function") {
      this.listeners.push(callback);
    }
  }

  notifyListeners(surveys) {
    this.listeners.forEach(cb => {
      try { cb(surveys); } catch(e) {}
    });
  }

  async getAll() {
    await this.isReady;

    // If cloud is enabled and online, fetch from Firebase
    if (this.isCloudEnabled && navigator.onLine) {
      try {
        const snapshot = await this.firebaseDB.ref("surveys").once("value");
        const val = snapshot.val() || {};
        const items = Object.values(val);
        items.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        return items;
      } catch (err) {
        console.warn("Cloud read failed, fallback to local:", err);
      }
    }

    // Otherwise read from local IndexedDB
    return await this._getAllLocal();
  }

  async getById(id) {
    await this.isReady;

    if (this.isCloudEnabled && navigator.onLine) {
      try {
        const snapshot = await this.firebaseDB.ref(`surveys/${id}`).once("value");
        if (snapshot.exists()) {
          const data = snapshot.val();
          await this._saveLocal(data);
          return data;
        }
      } catch (err) {}
    }

    return await this._getByIdLocal(id);
  }

  async save(survey) {
    await this.isReady;
    const now = new Date().toISOString();

    if (!survey.id) {
      survey.id = "srv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
      survey.createdAt = now;
    }
    survey.updatedAt = now;

    // 1. Save to local cache first
    await this._saveLocal(survey);

    // 2. Save to Cloud if available
    if (this.isCloudEnabled) {
      try {
        await this.firebaseDB.ref(`surveys/${survey.id}`).set(survey);
      } catch (err) {
        console.warn("Cloud save failed, saved locally:", err);
      }
    }

    return survey;
  }

  async delete(id) {
    await this.isReady;

    // Delete locally
    await this._deleteLocal(id);

    // Delete in Cloud
    if (this.isCloudEnabled) {
      try {
        await this.firebaseDB.ref(`surveys/${id}`).remove();
      } catch (err) {}
    }

    return true;
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

  // --- Local Storage & IndexedDB Helpers ---
  async _getAllLocal() {
    if (!this.localDB) return this._fallbackGetAll();
    return new Promise((resolve) => {
      const tx = this.localDB.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result || [];
        results.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        resolve(results);
      };
      req.onerror = () => resolve([]);
    });
  }

  async _getByIdLocal(id) {
    if (!this.localDB) return this._fallbackGetById(id);
    return new Promise((resolve) => {
      const tx = this.localDB.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async _saveLocal(survey) {
    if (!this.localDB) return this._fallbackSave(survey);
    return new Promise((resolve) => {
      const tx = this.localDB.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(survey);
      req.onsuccess = () => resolve(survey);
      req.onerror = () => resolve(survey);
    });
  }

  async _deleteLocal(id) {
    if (!this.localDB) return this._fallbackDelete(id);
    return new Promise((resolve) => {
      const tx = this.localDB.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
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
