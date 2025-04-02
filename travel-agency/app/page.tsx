"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { MainHeader } from "@/components/main-header"
import { MainMenu } from "@/components/main-menu"
import { FinancialEntryForm } from "@/components/financial-entry-form"
import { TourSalesForm } from "@/components/tour-sales-form"
import { DataView } from "@/components/data-view"
import { SettingsView } from "@/components/settings-view"
import { AnalyticsView } from "@/components/analytics-view"
import { DashboardView } from "@/components/dashboard-view"
import { CalendarView } from "@/components/calendar-view"
import { BackupRestoreView } from "@/components/backup-restore"
import { SplashScreen } from "@/components/splash-screen"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { CurrencyView } from "@/components/currency-view"
import { exportData, importData } from "@/lib/export-import"
import { getAllData, addData, updateData, deleteData, initializeDB } from "@/lib/db"
import { v4 as uuidv4 } from 'uuid';

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

export default function Home() {
  const [currentView, setCurrentView] = useState<string>("splash")
  const [financialData, setFinancialData] = useState<Financial[]>([])
  const [toursData, setToursData] = useState<Tour[]>([])
  const [editingRecord, setEditingRecord] = useState<Tour | Financial | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState<{
    tourForm: Tour | null;
    financialForm: Financial | null;
    lastView: string | null;
  }>({
    tourForm: null,
    financialForm: null,
    lastView: null
  });

  // Veri yükleme fonksiyonu - useCallback ile memoize edildi
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Veritabanını başlat ve senkronize et
      await initializeDB();
      
      // Tüm verileri al
      const tours = await getAllData("tours") as Tour[];
      const financials = await getAllData("financials") as Financial[];
      
      console.log("Veriler yüklendi:", { tours, financials });
      
      // State'i güncelle
      setToursData(tours || []);
      setFinancialData(financials || []);
      setIsInitialized(true);
    } catch (error) {
      console.error("Veri yükleme hatası:", error)
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Başlangıçta ve her 1 dakikada bir verileri yenile
  useEffect(() => {
    // Doğrudan loadData'yı çağır
    loadData();
    
    // Otomatik yenileme için 1 dakikalık zamanlayıcı
    const refreshInterval = setInterval(() => {
      loadData();
    }, 60 * 1000); // 1 dakika
    
    return () => clearInterval(refreshInterval);
  }, [loadData]);

  // Navigasyon yönetimi - useCallback ile memoize edildi
  const navigateTo = useCallback((view: string) => {
    // Veri görüntüleme veya tablo sayfalarına geçmeden önce yenile
    if (view === "data-view" || view === "dashboard" || view === "calendar" || view === "analytics") {
      loadData();
    }
    
    // Mevcut formdan ayrılıyorsa verileri sakla
    if (currentView === "tour-sales" && view !== "tour-sales") {
      setFormData(prev => ({...prev, tourForm: editingRecord as Tour, lastView: currentView}));
    } else if (currentView === "financial-entry" && view !== "financial-entry") {
      setFormData(prev => ({...prev, financialForm: editingRecord as Financial, lastView: currentView}));
    }
    
    // Geri dönüyorsa ve saklanmış veri varsa onu yükle
    if (view === "tour-sales" && formData.lastView !== "tour-sales" && formData.tourForm) {
      setEditingRecord(formData.tourForm);
    } else if (view === "financial-entry" && formData.lastView !== "financial-entry" && formData.financialForm) {
      setEditingRecord(formData.financialForm);
    } else if (view !== "tour-sales" && view !== "financial-entry") {
      // Sadece form sayfalarından farklı sayfalara geçerken kaydı sıfırla
      setEditingRecord(null);
    }
    
    setCurrentView(view);
  }, [currentView, editingRecord, formData, loadData]);

  const handleSplashFinish = useCallback(() => {
    setCurrentView("dashboard")
  }, [])

  // Veri güncelleme fonksiyonu - useCallback ile memoize edildi
  const handleDataUpdate = useCallback(async (type: string, newData: Financial[] | Tour[]) => {
    try {
      if (type === "financial") {
        // Finansal verileri güncelle
        setFinancialData(newData as Financial[])

        // Veritabanı işlemleri - tüm kayıtları güncelle
        for (const item of newData as Financial[]) {
          await updateData("financials", item);
        }
      } else if (type === "tours") {
        // Tur verilerini güncelle
        setToursData(newData as Tour[])

        // Veritabanı işlemleri - tüm kayıtları güncelle
        for (const item of newData as Tour[]) {
          await updateData("tours", item);
        }
      }

      toast({
        title: "Başarılı!",
        description: "Veriler başarıyla güncellendi.",
      })
      
      // Değişiklikleri hemen göster
      await loadData();
    } catch (error) {
      console.error("Veri güncelleme hatası:", error)
      toast({
        title: "Hata",
        description: "Veriler güncellenirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      })
    }
  }, [toast, loadData])

  // Tur kaydetme fonksiyonu - useCallback ile memoize edildi
  const handleSaveTour = useCallback(async (tourData: Tour) => {
    try {
      // ID yoksa yeni bir ID oluştur
      const dataToSave = tourData.id ? tourData : {...tourData, id: uuidv4()};
      
      if (dataToSave.id && toursData.some((tour) => tour.id === dataToSave.id)) {
        // Mevcut turu güncelle
        await updateData("tours", dataToSave);
        setToursData(prev => prev.map(tour => tour.id === dataToSave.id ? dataToSave : tour));
      } else {
        // Yeni tur ekle
        const savedTour = await addData("tours", dataToSave);
        setToursData(prev => [...prev, savedTour]);
      }

      // Form verilerini temizle
      setFormData(prev => ({...prev, tourForm: null, lastView: null}));
      setEditingRecord(null);
      
      toast({
        title: "Başarılı!",
        description: "Tur satışı başarıyla kaydedildi.",
      });

      // Verileri yenile ve dashboard'a dön
      await loadData();
      navigateTo("dashboard");
    } catch (error: any) {
      console.error("Tur kaydetme hatası:", error);
      toast({
        title: "Hata",
        description: "Tur satışı kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }
  }, [toursData, navigateTo, toast, loadData]);

  // Finansal kaydetme fonksiyonu - useCallback ile memoize edildi
  const handleSaveFinancial = useCallback(async (data: Financial) => {
    try {
      // ID yoksa yeni bir ID oluştur
      const dataToSave = data.id ? data : {...data, id: uuidv4()};
      
      if (dataToSave.id && financialData.some((item) => item.id === dataToSave.id)) {
        // Mevcut finansal kaydı güncelle
        await updateData("financials", dataToSave);
        setFinancialData(prev => prev.map(item => item.id === dataToSave.id ? dataToSave : item));
      } else {
        // Yeni finansal kayıt ekle
        const savedData = await addData("financials", dataToSave);
        setFinancialData(prev => [...prev, savedData]);
      }

      // Form verilerini temizle
      setFormData(prev => ({...prev, financialForm: null, lastView: null}));
      setEditingRecord(null);
      
      toast({
        title: "Başarılı!",
        description: "Finansal kayıt başarıyla kaydedildi.",
      });

      // Verileri yenile ve dashboard'a dön
      await loadData();
      navigateTo("dashboard");
    } catch (error: any) {
      console.error("Finansal kayıt hatası:", error);
      toast({
        title: "Hata",
        description: "Finansal kayıt kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }
  }, [financialData, navigateTo, toast, loadData]);

  // Kayıt silme fonksiyonu
  const handleDeleteRecord = useCallback(async (type: string, id: string) => {
    try {
      // Önce UI'dan kaldır (hemen tepki için)
      if (type === "tours") {
        setToursData(prev => prev.filter(item => item.id !== id));
      } else if (type === "financial") {
        setFinancialData(prev => prev.filter(item => item.id !== id));
      }
      
      // Sonra veritabanından sil
      await deleteData(type === "tours" ? "tours" : "financials", id);
      
      toast({
        title: "Başarılı!",
        description: "Kayıt başarıyla silindi.",
      });
      
      // Diğer bileşenlerin de verileri görmesi için verileri yenile
      await loadData();
      
      console.log(`${type} tipindeki ${id} ID'li kayıt silindi`);
    } catch (error) {
      console.error("Kayıt silme hatası:", error);
      toast({
        title: "Hata",
        description: "Kayıt silinirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
      
      // Hata durumunda verileri tekrar yükleyerek tutarlı hale getir
      await loadData();
    }
  }, [toast, loadData]);

  // Kayıt düzenleme fonksiyonu - useCallback ile memoize edildi
  const handleEditRecord = useCallback((type: string, record: Tour | Financial) => {
    setEditingRecord(record)
    if (type === "tours") {
      navigateTo("tour-sales")
    } else if (type === "financial") {
      navigateTo("financial-entry")
    }
  }, [navigateTo])

  // Veri dışa aktarma fonksiyonu - useCallback ile memoize edildi
  const handleExportData = useCallback(async () => {
    try {
      const success = await exportData()
      if (success) {
        toast({
          title: "Başarılı!",
          description: "Veriler başarıyla dışa aktarıldı.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Veriler dışa aktarılırken bir hata oluştu: " + (error.message || "Bilinmeyen hata"),
        variant: "destructive",
      })
    }
  }, [toast])

  // Veri içe aktarma fonksiyonu - useCallback ile memoize edildi
  const handleImportData = useCallback(async () => {
    try {
      await importData()
      toast({
        title: "Başarılı!",
        description: "Veriler başarıyla içe aktarıldı.",
      })
      // Sayfayı yenile
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Veriler içe aktarılırken bir hata oluştu: " + (error.message || "Bilinmeyen hata"),
        variant: "destructive",
      })
    }
  }, [toast])

  // Splash screen göster
  if (currentView === "splash") {
    return <SplashScreen onFinish={handleSplashFinish} />
  }

  return (
    <div className="min-h-screen bg-white">
      <MainHeader onNavigate={navigateTo} currentView={currentView} />

      <main className="container mx-auto py-6 px-4">
        {!isInitialized ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#00a1c6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Veriler yükleniyor...</p>
            </div>
          </div>
        ) : (
          <>
            {currentView === "main-menu" && <MainMenu onNavigate={navigateTo} />}

            {currentView === "dashboard" && <DashboardView onNavigate={navigateTo} />}

            {currentView === "calendar" && (
              <CalendarView
                onNavigate={navigateTo}
                toursData={toursData}
                onViewTour={(id) => {
                  const tour = toursData.find((t) => t.id === id)
                  if (tour) {
                    setEditingRecord(tour)
                    navigateTo("tour-sales")
                  }
                }}
              />
            )}

            {currentView === "financial-entry" && (
              <FinancialEntryForm
                initialData={editingRecord}
                onCancel={() => navigateTo("dashboard")}
                onSave={handleSaveFinancial}
              />
            )}

            {currentView === "tour-sales" && (
              <TourSalesForm 
                initialData={editingRecord} 
                onCancel={() => navigateTo("dashboard")} 
                onSave={handleSaveTour} 
              />
            )}

            {currentView === "data-view" && (
              <DataView
                financialData={financialData}
                toursData={toursData}
                onClose={() => navigateTo("dashboard")}
                onDataUpdate={handleDataUpdate}
                onEdit={handleEditRecord}
                onDelete={handleDeleteRecord}
                isLoading={isLoading}
                onRefresh={loadData}
              />
            )}

            {currentView === "settings" && (
              <SettingsView 
                onClose={() => navigateTo("dashboard")} 
                onExport={handleExportData}
                onImport={handleImportData}
              />
            )}

            {currentView === "analytics" && (
              <AnalyticsView 
                financialData={financialData} 
                toursData={toursData} 
                onClose={() => navigateTo("dashboard")} 
                isLoading={isLoading}
                onRefresh={loadData}
              />
            )}

            {currentView === "backup-restore" && (
              <BackupRestoreView 
                onClose={() => navigateTo("dashboard")} 
                onExport={handleExportData}
                onImport={handleImportData}
              />
            )}

            {currentView === "currency" && (
              <CurrencyView onClose={() => navigateTo("dashboard")} />
            )}
          </>
        )}
      </main>

      <footer className="py-6 text-center text-muted-foreground border-t">
        <div className="flex items-center justify-center mb-2">
          <img src="/logo.svg" alt="PassionisTravel Logo" className="h-8 mr-2" />
          <p className="font-medium">Yönetim Sistemi</p>
        </div>
        <p>&copy; {new Date().getFullYear()} PassionisTravel Yönetim Sistemi. Tüm hakları saklıdır.</p>
      </footer>

      <Toaster />
    </div>
  )
}

