// Yerel depolamadan veri yükleme
export const loadSavedData = async () => {
  try {
    // Finansal verileri yükle
    const savedFinancialData = localStorage.getItem("financialData")
    const financialData = savedFinancialData ? JSON.parse(savedFinancialData) : []

    // Tur verilerini yükle
    const savedToursData = localStorage.getItem("toursData")
    const toursData = savedToursData ? JSON.parse(savedToursData) : []

    // Şirket bilgilerini yükle
    const savedCompanyInfo = localStorage.getItem("companyInfo")
    const companyInfo = savedCompanyInfo
      ? JSON.parse(savedCompanyInfo)
      : {
          name: "PassionisTravel",
          address: "Örnek Mahallesi, Örnek Caddesi No:123, İstanbul",
          phone: "+90 212 123 4567",
          email: "info@passionistour.com",
          taxId: "1234567890",
          website: "www.passionistour.com",
        }

    // Tercih ayarlarını yükle
    const savedPreferences = localStorage.getItem("preferences")
    const preferences = savedPreferences
      ? JSON.parse(savedPreferences)
      : {
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
        }

    return { financialData, toursData, companyInfo, preferences }
  } catch (error) {
    console.error("Veri yükleme hatası:", error)
    return { financialData: [], toursData: [], companyInfo: {}, preferences: {} }
  }
}

// Tercih tipi
export interface Preferences {
  darkMode?: boolean;
  notifications?: boolean;
  autoBackup?: boolean;
  language?: string;
  defaultCurrency?: string;
  dateFormat?: string;
  autoCalculateTax?: boolean;
  taxRate?: string;
  showPricesWithTax?: boolean;
  roundPrices?: boolean;
}

// Yerel depolamaya veri kaydetme
export const saveToLocalStorage = async (key: string, data: any): Promise<boolean> => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error("Veri kaydetme hatası:", error)
    return false
  }
}

// Verileri temizleme
export const clearData = async (): Promise<boolean> => {
  try {
    localStorage.removeItem("financialData")
    localStorage.removeItem("toursData")
    return true
  } catch (error) {
    console.error("Veri temizleme hatası:", error)
    return false
  }
}

// Para birimi formatı - Veri kaydedilen para birimi de dikkate alınarak
export const formatCurrency = (amount: number | string, currency: string = "TRY", preferences?: Preferences | null): string => {
  if (!amount && amount !== 0) return "-";
  
  // Veri kaydedilen para birimi (currency parametresi) kullanıcının tercih ettiği para biriminden farklı olabilir
  // Kullanıcı tercihi varsa ve currency parametresi belirtilmediyse tercih kullanılır
  const effectiveCurrency = currency && currency !== "" 
    ? currency // Öncelikle verinin kendi para birimini kullan
    : (preferences?.defaultCurrency && preferences.defaultCurrency !== "")
      ? preferences.defaultCurrency // Veri para birimi yoksa tercih kullan
      : "TRY"; // Hiçbiri yoksa varsayılan TRY
  
  try {
    // Sayısal değere çevir
    const numericAmount = typeof amount === 'string' 
      ? Number.parseFloat(amount.replace(/[^\d.-]/g, '')) 
      : Number(amount);
    
    if (isNaN(numericAmount)) return "-";
    
    // Para birimi sembolleri
    const currencySymbols: Record<string, string> = {
      TRY: "₺",
      USD: "$",
      EUR: "€",
      GBP: "£",
    };
    
    // Doğru lokalizasyon
    const locales: Record<string, string> = {
      TRY: "tr-TR",
      USD: "en-US",
      EUR: "de-DE",
      GBP: "en-GB",
    };
    
    const locale = locales[effectiveCurrency] || "tr-TR";
    const symbol = currencySymbols[effectiveCurrency] || effectiveCurrency;
    
    // toLocaleString ile formatla - her tarayıcıda en tutarlı sonucu verir
    if (effectiveCurrency === "TRY") {
      return `${symbol} ${numericAmount.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else {
      // Diğer para birimleri için
      return numericAmount.toLocaleString(locale, {
        style: "currency",
        currency: effectiveCurrency,
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2,
      });
    }
  } catch (error) {
    // Herhangi bir hata durumunda basit formatlama
    console.error("Para birimi formatlama hatası:", error);
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return isNaN(numericAmount) ? "-" : `${numericAmount.toFixed(2)}`;
  }
}

// Tarih formatı
export const formatDate = (dateString: string, format: string = "DD.MM.YYYY"): string => {
  const date = new Date(dateString)

  if (format === "DD.MM.YYYY") {
    return date.toLocaleDateString("tr-TR")
  } else if (format === "MM/DD/YYYY") {
    return date.toLocaleDateString("en-US")
  } else if (format === "YYYY-MM-DD") {
    return date.toISOString().split("T")[0]
  }

  return date.toLocaleDateString("tr-TR")
}

// Döviz kurları tipi
export interface ExchangeRate {
  code: string;
  buying: number;
  selling: number;
}

// Döviz çevirme
export const convertCurrency = (
  amount: number | string, 
  fromCurrency: string, 
  toCurrency: string, 
  rates: ExchangeRate[],
  preferences?: Preferences | null
): number => {
  // String değerini sayıya çevir
  const numericAmount = typeof amount === 'string' ? 
    Number.parseFloat(amount.replace(/[^\d.-]/g, '')) : 
    Number(amount);
    
  if (isNaN(numericAmount)) {
    return 0;
  }
  
  // Eğer preferences verilmişse ve defaultCurrency ayarı varsa, hedef para birimi olarak onu kullan
  const effectiveToCurrency = preferences?.defaultCurrency || toCurrency;
  
  if (fromCurrency === effectiveToCurrency) {
    return numericAmount;
  }

  if (fromCurrency === "TRY" && effectiveToCurrency !== "TRY") {
    // TRY'den yabancı para birimine
    const currency = rates.find((r) => r.code === effectiveToCurrency)
    if (currency) {
      return numericAmount / currency.selling
    }
    return numericAmount;
  }

  if (fromCurrency !== "TRY" && effectiveToCurrency === "TRY") {
    // Yabancı para biriminden TRY'ye
    const currency = rates.find((r) => r.code === fromCurrency)
    if (currency) {
      return numericAmount * currency.buying
    }
    return numericAmount;
  }

  if (fromCurrency !== "TRY" && effectiveToCurrency !== "TRY") {
    // Yabancı para biriminden yabancı para birimine
    const fromRate = rates.find((r) => r.code === fromCurrency)
    const toRate = rates.find((r) => r.code === effectiveToCurrency)
    if (fromRate && toRate) {
      // Önce TRY'ye çevir, sonra hedef para birimine
      const tryAmount = numericAmount * fromRate.buying
      return tryAmount / toRate.selling
    }
    return numericAmount;
  }

  return numericAmount;
}

