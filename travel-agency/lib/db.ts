// IndexedDB veritabanı işlemleri için yardımcı fonksiyonlar
const DB_NAME = "passionistravelDB"
const DB_VERSION = 2 // Sürüm 1'den 2'ye yükseltildi

// Yedek olarak localStorage'i kullanalım
const LS_PREFIX = "passionisTravel_"

// Veritabanı şema tipleri
interface StoreConfig {
  keyPath: string;
  indexes?: string[];
}

// Veritabanı şeması
const STORES: Record<string, StoreConfig> = {
  tours: { keyPath: "id", indexes: ["customerName", "tourDate"] },
  financials: { keyPath: "id", indexes: ["date", "type"] },
  customers: { keyPath: "id", indexes: ["name", "phone"] },
  settings: { keyPath: "id" },
  expenses: { keyPath: "id", indexes: ["type", "name"] },
  providers: { keyPath: "id", indexes: ["name"] },
  activities: { keyPath: "id", indexes: ["title", "date"] },
}

// Bellek içi önbellek (uygulama kapanana kadar sürer)
const memoryCache: Record<string, any[]> = {
  tours: [],
  financials: [],
  customers: [],
  settings: [],
  expenses: [],
  providers: [],
  activities: [],
};

// Veritabanı bağlantısını aç
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (event) => {
        console.error("IndexedDB açılırken hata oluştu: " + request.error)
        reject("Veritabanı açılırken hata oluştu: " + request.error)
      }

      request.onsuccess = (event) => {
        const db = request.result;
        console.log(`Veritabanı başarıyla açıldı: ${DB_NAME}, sürüm: ${db.version}`);
        
        // Mevcut depoların kontrolü
        const currentStores = Array.from(db.objectStoreNames);
        const requiredStores = Object.keys(STORES);
        
        // Tüm gerekli depolar mevcut mu kontrol et
        const missingStores = requiredStores.filter(store => !currentStores.includes(store));
        
        if (missingStores.length > 0) {
          console.warn(`Eksik depolar tespit edildi: ${missingStores.join(', ')}. Veritabanını yeniden açmayı deneyin.`);
          // Veritabanını kapatıp tekrar aç - gerektiğinde
          db.close();
          indexedDB.deleteDatabase(DB_NAME);
          setTimeout(() => {
            const newRequest = indexedDB.open(DB_NAME, DB_VERSION);
            newRequest.onsuccess = () => resolve(newRequest.result);
            newRequest.onerror = () => reject(newRequest.error);
          }, 100);
        } else {
          resolve(db);
        }
      }

      request.onupgradeneeded = (event) => {
        const db = request.result

        console.log(`Veritabanı yükseltiliyor: ${DB_NAME}, sürüm: ${db.version}`);
        
        // Veri depolarını oluştur
        Object.entries(STORES).forEach(([storeName, storeConfig]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            console.log(`Yeni depo oluşturuluyor: ${storeName}`);
            const store = db.createObjectStore(storeName, { keyPath: storeConfig.keyPath })

            // İndeksleri oluştur
            if (storeConfig.indexes) {
              storeConfig.indexes.forEach((indexName: string) => {
                store.createIndex(indexName, indexName, { unique: false })
              })
            }
          } else {
            console.log(`Depo zaten mevcut: ${storeName}`);
          }
        })
      }
    } catch (error) {
      console.error("IndexedDB hatası, localStorage'e dönülüyor:", error)
      reject(error)
    }
  })
}

// Veritabanını senkronize etme işlevi düzeltildi
export const syncStorage = async (storeName: string): Promise<void> => {
  try {
    console.log(`${storeName} deposu senkronize ediliyor...`);
    // Önceki kayıtları temizle
    memoryCache[storeName] = [];
    
    // IndexedDB'den verileri al
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const dbData = request.result || [];
        console.log(`${storeName} için ${dbData.length} kayıt alındı`);
        
        // Bellek önbelleğine kaydet
        memoryCache[storeName] = [...dbData];
        
        // LocalStorage'e kaydet
        syncToLocalStorage(storeName, dbData);
        
        db.close();
        resolve();
      };
      
      request.onerror = () => {
        console.error(`${storeName} senkronizasyonu hatası`);
        db.close();
        
        // Yedek olarak localStorage'den veri almayı dene
        const localData = getFromLocalStorage(storeName);
        memoryCache[storeName] = [...localData];
        console.log(`${storeName} için localStorage'den ${localData.length} kayıt alındı`);
        resolve();
      };
    });
  } catch (error) {
    console.error(`${storeName} senkronizasyon hatası:`, error);
    
    // Yedek olarak localStorage'den veri almayı dene
    const localData = getFromLocalStorage(storeName);
    memoryCache[storeName] = [...localData];
    console.log(`${storeName} için hata sonrası localStorage'den ${localData.length} kayıt alındı`);
  }
};

// LocalStorage ile senkronize et
const syncToLocalStorage = (storeName: string, data: any[]): void => {
  try {
    const storageKey = `${LS_PREFIX}${storeName}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error(`LocalStorage senkronizasyon hatası (${storeName}):`, error);
  }
};

// Veri ekleme işlevi güçlendirildi
export const addData = async (storeName: string, data: any): Promise<any> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const id = await store.add(data);
    // IDBTransaction.done property'si yerine completed event'ini bekle
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    
    // localStorage'a da kaydet
    try {
      const existingData = localStorage.getItem(storeName === "settings" ? "settings" : `${storeName}Data`);
      const parsedData = existingData ? JSON.parse(existingData) : [];
      
      if (storeName === "settings") {
        localStorage.setItem(storeName, JSON.stringify(data));
      } else {
        parsedData.push(data);
        localStorage.setItem(`${storeName}Data`, JSON.stringify(parsedData));
      }
    } catch (localError) {
      console.error(`localStorage ${storeName} verisi kaydedilirken hata:`, localError);
    }
    
    return id;
  } catch (error) {
    console.error(`${storeName} veri eklenirken hata:`, error);
    throw error;
  }
};

// Veri güncelle
export const updateData = async (storeName: string, data: any): Promise<any> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const result = await store.put(data);
    // IDBTransaction.done property'si yerine completed event'ini bekle
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    
    // localStorage'ı da güncelle
    try {
      if (storeName === "settings") {
        localStorage.setItem(storeName, JSON.stringify(data));
      } else {
        const existingData = localStorage.getItem(`${storeName}Data`);
        const parsedData = existingData ? JSON.parse(existingData) : [];
        const updatedData = parsedData.map((item: any) => (item.id === data.id ? data : item));
        localStorage.setItem(`${storeName}Data`, JSON.stringify(updatedData));
      }
    } catch (localError) {
      console.error(`localStorage ${storeName} verisi güncellenirken hata:`, localError);
    }
    
    return result;
  } catch (error) {
    console.error(`${storeName} veri güncellenirken hata:`, error);
    throw error;
  }
};

// Veri silme işlevi iyileştirildi
export const deleteData = async (storeName: string, id: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    // Promise ile sonucu bekliyoruz
    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`${storeName}/${id} veritabanından silindi`);
        resolve();
      };
      request.onerror = () => {
        console.error(`${storeName}/${id} silinirken hata: ${request.error}`);
        reject(request.error);
      };
    });
    
    // Transaction tamamlanmasını bekle
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`${storeName}/${id} silme işlemi tamamlandı`);
        resolve();
      };
      transaction.onerror = () => {
        console.error(`${storeName}/${id} silme transaction hatası: ${transaction.error}`);
        reject(transaction.error);
      };
    });
    
    // Ayrıca bellek önbelleğini de güncelle
    if (memoryCache[storeName]) {
      memoryCache[storeName] = memoryCache[storeName].filter((item: any) => item.id !== id);
    }
    
    // localStorage'dan da sil
    try {
      // Hem eski hem de yeni formatı dene
      const oldKey = `${storeName}Data`;
      const newKey = `${LS_PREFIX}${storeName}`;
      
      // Eski format kontrolü
      const oldData = localStorage.getItem(oldKey);
      if (oldData) {
        const parsedData = JSON.parse(oldData);
        const filteredData = parsedData.filter((item: any) => item.id !== id);
        localStorage.setItem(oldKey, JSON.stringify(filteredData));
      }
      
      // Yeni format kontrolü
      const newData = localStorage.getItem(newKey);
      if (newData) {
        const parsedData = JSON.parse(newData);
        const filteredData = parsedData.filter((item: any) => item.id !== id);
        localStorage.setItem(newKey, JSON.stringify(filteredData));
      }
      
      // Event trigger et ki diğer componentler haberdar olsun
      window.dispatchEvent(new Event('storage'));
      
    } catch (localError) {
      console.error(`localStorage ${storeName} verisi silinirken hata:`, localError);
    }
    
    return;
  } catch (error) {
    console.error(`${storeName}/${id} veri silinirken hata:`, error);
    throw error;
  }
};

// Veri getirme fonksiyonu
export const getAllData = async (storeName: string): Promise<any[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    // Promise ile sonucu alıyoruz
    const data = await new Promise<any[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    
    // Transaction tamamlanmasını bekle
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    
    return data;
  } catch (error) {
    console.error(`${storeName} verileri alınırken hata:`, error);
    return [];
  }
};

// Belirli bir ID'ye sahip veriyi getirme
export const getDataById = async (storeName: string, id: string): Promise<any> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    
    // Request ile veriyi al
    const request = store.get(id);
    
    // Promise ile sonucu alıyoruz
    const data = await new Promise<any>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    
    // Transaction tamamlanmasını bekle
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    
    return data;
  } catch (error) {
    console.error(`${storeName}/${id} verisi alınırken hata:`, error);
    return null;
  }
};

// Veritabanını temizle
export const clearStore = async (storeName: string): Promise<void> => {
  try {
    // Önbellek temizle
    memoryCache[storeName] = [];
    
    // LocalStorage temizle
    clearLocalStorage(storeName);
    
    // IndexedDB temizle
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error("IndexedDB depo temizleme hatası");
        resolve();
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("IndexedDB hatası, temizleme işlemi tamamlanamadı:", error);
  }
};

// localStorage functions
const getFromLocalStorage = (storeName: string): any[] => {
  try {
    const storageKey = `${LS_PREFIX}${storeName}`;
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`localStorage okuma hatası (${storeName}):`, error);
    return [];
  }
};

const clearLocalStorage = (storeName: string) => {
  try {
    const storageKey = `${LS_PREFIX}${storeName}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error(`localStorage temizleme hatası (${storeName}):`, error);
  }
};

// Ayarları kaydet
export const saveSettings = async (settings: any): Promise<any> => {
  settings.id = "app-settings"; // Sabit bir ID kullan
  return updateData("settings", settings);
};

// Ayarları getir
export const getSettings = async (): Promise<any> => {
  try {
    const settings = await getDataById("settings", "app-settings");
    return settings || {}; // Ayarlar yoksa boş nesne döndür
  } catch (error) {
    console.error("Ayarlar alınırken hata:", error);
    return {};
  }
};

// Gider türlerini kaydet
export const saveExpenseTypes = async (expenseTypes: any[]): Promise<void> => {
  try {
    // Önce mevcut gider türlerini temizle
    await clearStore("expenses");

    // Sonra yeni gider türlerini ekle
    for (const expenseType of expenseTypes) {
      await addData("expenses", expenseType);
    }
  } catch (error) {
    console.error("Gider türleri kaydedilirken hata:", error);
    throw error;
  }
};

// Gider türlerini getir
export const getExpenseTypes = async (type?: string): Promise<any[]> => {
  try {
    const allExpenses = await getAllData("expenses");

    if (type) {
      return allExpenses.filter((expense) => expense.type === type);
    }

    return allExpenses;
  } catch (error) {
    console.error("Gider türleri alınırken hata:", error);
    return [];
  }
};

// Sağlayıcıları kaydet
export const saveProviders = async (providers: any[]): Promise<void> => {
  try {
    // Önce mevcut sağlayıcıları temizle
    await clearStore("providers");

    // Sonra yeni sağlayıcıları ekle
    for (const provider of providers) {
      await addData("providers", provider);
    }
  } catch (error) {
    console.error("Sağlayıcılar kaydedilirken hata:", error);
    throw error;
  }
};

// Sağlayıcıları getir
export const getProviders = async (): Promise<any[]> => {
  try {
    const allProviders = await getAllData("providers");
    return allProviders;
  } catch (error) {
    console.error("Sağlayıcılar alınırken hata:", error);
    return [];
  }
};

// Başlangıçta tüm mağazaları senkronize et
export const initializeDB = async (): Promise<void> => {
  console.log("Veritabanı başlatılıyor...");
  try {
    // Önce veritabanının var olduğundan emin ol
    const db = await openDB();
    
    // Tüm depoları senkronize et
    for (const storeName of Object.keys(STORES)) {
      try {
        await syncStorage(storeName);
        console.log(`${storeName} deposu senkronize edildi`);
      } catch (error) {
        console.error(`${storeName} senkronizasyonu başarısız:`, error);
      }
    }
    
    // Başlangıç ayarlarını oluştur
    const settings = await getSettings();
    if (!settings || !settings.id) {
      console.log("Varsayılan ayarlar oluşturuluyor...");
      const defaultSettings = {
        id: "app-settings",
        companyInfo: {
          name: "PassionisTravel",
          address: "Örnek Mahallesi, Örnek Caddesi No:123, İstanbul",
          phone: "+90 212 123 4567",
          email: "info@passionistour.com",
          taxId: "1234567890",
          website: "www.passionistour.com",
        },
        preferences: {
          darkMode: false,
          notifications: true,
          autoBackup: true,
          language: "tr",
          defaultCurrency: "TRY",
          dateFormat: "DD.MM.YYYY",
          autoCalculateTax: true,
          taxRate: "18",
          showPricesWithTax: true,
          roundPrices: true,
        },
        userSettings: {
          userName: "Admin",
          userRole: "admin",
        },
        users: [
          {
            id: "admin",
            name: "Admin Kullanıcı",
            role: "admin",
            active: true,
          }
        ]
      };
      
      await saveSettings(defaultSettings);
      
      // localStorage'a da yedekle
      localStorage.setItem("preferences", JSON.stringify(defaultSettings.preferences));
      localStorage.setItem("companyInfo", JSON.stringify(defaultSettings.companyInfo));
    }
    
    console.log("Veritabanı başarıyla başlatıldı");
    
  } catch (error) {
    console.error("Veritabanı başlatma hatası:", error);
    
    // localStorage'dan yükleme yapmayı dene
    Object.keys(STORES).forEach(storeName => {
      try {
        const localData = getFromLocalStorage(storeName);
        memoryCache[storeName] = [...localData];
        console.log(`${storeName} için localStorage'den ${localData.length} kayıt alındı`);
      } catch (e) {
        console.error(`${storeName} localStorage'den yüklenemedi:`, e);
      }
    });
  }
};

// Aktiviteleri getir
export const getActivities = async (): Promise<any> => {
  try {
    return getAllData("activities");
  } catch (error) {
    console.error("Aktiviteler alınırken hata:", error);
    return [];
  }
};

// Aktiviteleri kaydet
export const saveActivities = async (activities: any[]): Promise<any> => {
  try {
    // Tüm aktiviteleri kaydediyoruz
    for (const activity of activities) {
      await updateData("activities", activity);
    }
    return true;
  } catch (error) {
    console.error("Aktiviteler kaydedilirken hata:", error);
    throw error;
  }
};

