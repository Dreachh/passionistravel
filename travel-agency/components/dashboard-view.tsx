"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, Calendar, TrendingUp, Globe, Database, 
  MapPin, Award, Clock, CheckCircle, BarChart 
} from "lucide-react"
import { getAllData, getSettings } from "@/lib/db"
import { formatCurrency } from "@/lib/data-utils"

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

type Tour = {
  id: string;
  tourName: string;
  tourDate: string;
  numberOfPeople: string;
  createdAt?: string;
  [key: string]: any;
}

type Financial = {
  id: string;
  type: string;
  amount: string;
  date: string;
  category: string;
  [key: string]: any;
}

interface Activity {
  type: string;
  title: string;
  date: Date;
  color: string;
  amount?: number | string; // İsteğe bağlı tutar alanı
  currency?: string; // İsteğe bağlı para birimi alanı
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [loadCount, setLoadCount] = useState(0)
  const [preferences, setPreferences] = useState<any>({ defaultCurrency: "TRY" })

  // Veritabanından en son tur ve finansal verileri al
  const [recentFinancialData, setRecentFinancialData] = useState<any[]>([])
  const [recentToursData, setRecentToursData] = useState<any[]>([])

  // Veri yükleme fonksiyonu - açıkça dışarıda tanımlanmış
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [toursData, financialData, settingsData] = await Promise.all([
        getAllData("tours"),
        getAllData("financials"),
        getSettings(),
      ]);

      // Preferences ayarlarını yükle
      if (settingsData?.preferences) {
        setPreferences(settingsData.preferences);
      }

      const tours = Array.isArray(toursData) ? toursData : [];
      const financials = Array.isArray(financialData) ? financialData : [];
      
      console.log(`Dashboard yüklendi: ${tours.length} tur, ${financials.length} finansal kayıt`);
      
      // Son 30 gün içindeki veriler
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const recentTours = tours.filter((tour: any) => {
        const tourDate = new Date(tour.tourDate || new Date());
        return tourDate >= startDate;
      });
      
      const recentFinancials = financials.filter((f: any) => {
        const financialDate = new Date(f.date || new Date());
        return financialDate >= startDate;
      });
      
      setRecentToursData(recentTours);
      setRecentFinancialData(recentFinancials);
      
      setLoadCount((prev) => prev + 1);
    } catch (error) {
      console.error("Dashboard veri yükleme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setRecentToursData, setRecentFinancialData, setPreferences, setLoadCount]);

  // Sayfa yüklendiğinde verileri yükle
  useEffect(() => {
    loadData();
    
    // 30 saniyede bir otomatik yenile
    const refreshInterval = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [loadData]);

  // Son 30 gün içindeki verileri filtrele
  const last30Days = new Date()
  last30Days.setDate(last30Days.getDate() - 30)

  // Yükleme durumunda veya veri yoksa gerçekçi veriler göster
  useEffect(() => {
    if (loadCount > 0 && (recentToursData.length === 0 || recentFinancialData.length === 0)) {
      console.log("Veri yok, tekrar dene...");
      // 1 saniye sonra tekrar yüklemeyi dene
      const timer = setTimeout(() => {
        loadData();
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [loadCount, recentToursData.length, recentFinancialData.length]);

  // İkinci tanımlamayı filtrelenmiş veri olarak değiştiriyorum
  const filteredFinancialData = useMemo(() => {
    if (!recentFinancialData || recentFinancialData.length === 0) {
      return [];
    }
    return recentFinancialData.filter((item) => {
      try {
        const itemDate = new Date(item.date || new Date());
        return itemDate >= last30Days;
      } catch (error) {
        console.error("Tarih filtreleme hatası:", error);
        return false;
      }
    });
  }, [recentFinancialData, last30Days]);
  
  const filteredToursData = useMemo(() => {
    if (!recentToursData || recentToursData.length === 0) {
      return [];
    }
    return recentToursData.filter((item) => {
      try {
        const itemDate = new Date(item.tourDate || new Date());
        return itemDate >= last30Days;
      } catch (error) {
        console.error("Tarih filtreleme hatası:", error);
        return false;
      }
    });
  }, [recentToursData, last30Days]);

  // Toplam gelir
  const totalIncome = useMemo(() => 
    filteredFinancialData
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + (Number.parseFloat(String(item.amount)) || 0), 0)
  , [filteredFinancialData]);

  // Toplam müşteri sayısı
  const totalCustomers = useMemo(() => 
    filteredToursData.reduce((sum, item) => sum + (Number.parseInt(String(item.numberOfPeople)) || 0), 0)
  , [filteredToursData]);

  // Yaklaşan turlar (bugünden sonraki 30 gün)
  const today = new Date()
  const next30Days = new Date()
  next30Days.setDate(next30Days.getDate() + 30)

  const upcomingTours = useMemo(() => 
    filteredToursData.filter((item) => {
      const tourDate = new Date(item.tourDate)
      return tourDate >= today && tourDate <= next30Days
    })
  , [filteredToursData, today, next30Days]);

  // Büyüme oranı hesapları
  const previous30Days = new Date()
  previous30Days.setDate(previous30Days.getDate() - 60)

  const previousPeriodData = recentFinancialData.filter((item) => {
    const itemDate = new Date(item.date)
    return itemDate >= previous30Days && itemDate < last30Days
  })

  const previousPeriodIncome = previousPeriodData
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + (Number.parseFloat(String(item.amount)) || 0), 0)

  const growthRate = previousPeriodIncome > 0 ? ((totalIncome - previousPeriodIncome) / previousPeriodIncome) * 100 : 0

  // Toplam turlar
  const totalTours = filteredToursData.length
  
  // Tamamlanmış turlar (bugünden önce)
  const completedTours = useMemo(() => 
    filteredToursData.filter(item => new Date(item.tourDate) < today).length
  , [filteredToursData, today]);

  // Tüm aktiviteler için tip ataması yapalım
  const recentActivities: Activity[] = useMemo(() => {
    return [
      ...filteredToursData.map((tour) => ({
        type: "tour",
        title: `Yeni tur satışı: ${tour.tourName}`,
        date: new Date(tour.createdAt || tour.tourDate),
        color: "bg-green-500",
      })),
      ...filteredFinancialData.map((financial) => ({
        type: "financial",
        title: `${financial.type === "income" ? "Gelir" : "Gider"} kaydı: ${financial.category}`,
        date: new Date(financial.date),
        color: financial.type === "income" ? "bg-blue-500" : "bg-yellow-500",
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
  }, [filteredToursData, filteredFinancialData]);

  // Tercihler değiştiğinde güncelleme
  useEffect(() => {
    // localStorage değişikliklerini takip et
    const handleStorageChange = () => {
      try {
        // localStorage'dan tercihleri oku
        const savedPreferences = localStorage.getItem("preferences");
        if (savedPreferences) {
          const parsedPreferences = JSON.parse(savedPreferences);
          // Tercihleri güncelle
          setPreferences(parsedPreferences);
          console.log("Tercihler güncellendi:", parsedPreferences);
        }
      } catch (error) {
        console.error("Tercihler güncellenirken hata:", error);
      }
    };

    // Event listener ekle
    window.addEventListener('storage', handleStorageChange);
    
    // Sayfa yüklendiğinde localStorage'dan tercihleri yükle
    handleStorageChange();
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Toplam Turlar</CardTitle>
            <Globe className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTours}</div>
            <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Müşteriler</CardTitle>
            <Users className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Son 30 gün</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Yaklaşan Turlar</CardTitle>
            <Calendar className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingTours.length}</div>
            <p className="text-xs text-muted-foreground">Önümüzdeki 30 gün</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan Turlar</CardTitle>
            <CheckCircle className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTours}</div>
            <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle className="flex items-center text-[#2b3275]">
              <Clock className="h-5 w-5 mr-2 text-[#00a1c6]" />
              Hızlı İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 p-6">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 border-[#00a1c6] hover:bg-[#00a1c6]/10 hover:text-[#2b3275]"
              onClick={() => onNavigate("financial-entry")}
            >
              <Award className="h-6 w-6 text-[#00a1c6]" />
              <span>Finansal Giriş</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 border-[#00a1c6] hover:bg-[#00a1c6]/10 hover:text-[#2b3275]"
              onClick={() => onNavigate("tour-sales")}
            >
              <Globe className="h-6 w-6 text-[#00a1c6]" />
              <span>Tur Satışı</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 border-[#00a1c6] hover:bg-[#00a1c6]/10 hover:text-[#2b3275]"
              onClick={() => onNavigate("data-view")}
            >
              <Database className="h-6 w-6 text-[#00a1c6]" />
              <span>Veri Görüntüleme</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 border-[#00a1c6] hover:bg-[#00a1c6]/10 hover:text-[#2b3275]"
              onClick={() => onNavigate("calendar")}
            >
              <Calendar className="h-6 w-6 text-[#00a1c6]" />
              <span>Takvim</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle className="flex items-center text-[#2b3275]">
              <BarChart className="h-5 w-5 mr-2 text-[#00a1c6]" />
              Son Etkinlikler
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-2 h-2 rounded-full ${activity.color} mr-2`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.date.toLocaleDateString("tr-TR")},{" "}
                        {activity.date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        {activity.amount && activity.currency && 
                          <span className="ml-2 font-medium">
                            {formatCurrency(activity.amount, activity.currency || "TRY", preferences)}
                          </span>
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Calendar className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-muted-foreground">Henüz etkinlik yok</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-sm">
        <div className="flex justify-between mb-1">
          <span>Gelir (Son 30 gün):</span>
          <span className="font-medium text-green-600">{formatCurrency(totalIncome, preferences.defaultCurrency, preferences)}</span>
        </div>
        <div className="flex justify-between">
          <span>Büyüme oranı:</span>
          <span className={`font-medium ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growthRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

