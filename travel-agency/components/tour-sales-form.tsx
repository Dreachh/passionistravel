"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { v4 as uuidv4 } from "uuid"
import { Plus, Trash2, Save, ArrowRight, ArrowLeft, Check, Printer } from "lucide-react"
import { getExpenseTypes, getProviders } from "@/lib/db"
import { useToast } from "@/components/ui/use-toast"

// Bileşen prop tipleri
interface TourSalesFormProps {
  initialData: any | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

interface Activity {
  id: string;
  name: string;
  date: string;
  duration: string;
  price: string;
  currency: string;
  provider: string;
  details: string;
  participants: number;
}

interface Expense {
  id: string;
  type: string;
  name: string;
  provider: string;
  amount: string;
  currency: string;
  details: string;
}

interface AdditionalCustomer {
  id: string;
  name: string;
  phone: string;
  idNumber: string;
}

interface TourFormData {
  id: string;
  serialNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerIdNumber: string;
  additionalCustomers: AdditionalCustomer[];
  tourName: string;
  tourDate: string;
  tourEndDate: string;
  numberOfPeople: number;
  numberOfChildren: number;
  pricePerPerson: string;
  totalPrice: string;
  currency: string;
  paymentStatus: string;
  paymentMethod: string;
  partialPaymentAmount: string;
  partialPaymentCurrency: string;
  notes: string;
  expenses: Expense[];
  createdAt: string;
  updatedAt: string;
  activities: Activity[];
}

export function TourSalesForm({ initialData = null, onSave, onCancel }: TourSalesFormProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [expenseTypes, setExpenseTypes] = useState<any[]>([])
  // Providers state'i ekle
  const [providers, setProviders] = useState<any[]>([])
  const [formChanged, setFormChanged] = useState(false)

  const [formData, setFormData] = useState<TourFormData>({
    id: initialData?.id || uuidv4(),
    serialNumber: initialData?.serialNumber || "",
    customerName: initialData?.customerName || "",
    customerPhone: initialData?.customerPhone || "",
    customerEmail: initialData?.customerEmail || "",
    customerAddress: initialData?.customerAddress || "",
    customerIdNumber: initialData?.customerIdNumber || "",
    additionalCustomers: initialData?.additionalCustomers || [],
    tourName: initialData?.tourName || "",
    tourDate: initialData?.tourDate || new Date().toISOString().split("T")[0],
    tourEndDate: initialData?.tourEndDate || "",
    numberOfPeople: initialData?.numberOfPeople || 1,
    numberOfChildren: initialData?.numberOfChildren || 0,
    pricePerPerson: initialData?.pricePerPerson || "",
    totalPrice: initialData?.totalPrice || "",
    currency: initialData?.currency || "TRY",
    paymentStatus: initialData?.paymentStatus || "pending",
    paymentMethod: initialData?.paymentMethod || "cash",
    partialPaymentAmount: initialData?.partialPaymentAmount || "",
    partialPaymentCurrency: initialData?.partialPaymentCurrency || "TRY",
    notes: initialData?.notes || "",
    expenses: initialData?.expenses || [],
    createdAt: initialData?.createdAt || new Date().toISOString(),
    updatedAt: initialData?.updatedAt || new Date().toISOString(),
    activities: initialData?.activities || [],
  })

  // Form verilerini localStorage'e kaydet
  useEffect(() => {
    if (formChanged) {
      try {
        localStorage.setItem('tourSalesFormData', JSON.stringify(formData));
        console.log('Form verileri kaydedildi:', formData);
      } catch (error) {
        console.error('Form verilerini kaydetme hatası:', error);
      }
    }
  }, [formData, formChanged]);

  // İlk yüklemede kayıtlı verileri al (eğer initialData yoksa)
  useEffect(() => {
    if (!initialData) {
      try {
        const savedFormData = localStorage.getItem('tourSalesFormData');
        if (savedFormData) {
          const parsedData = JSON.parse(savedFormData);
          console.log('Kayıtlı form verileri bulundu:', parsedData);
          setFormData(parsedData);
        }
      } catch (error) {
        console.error('Kayıtlı form verilerini alma hatası:', error);
      }
    }
  }, [initialData]);

  // Gider türlerini yükle
  useEffect(() => {
    const loadExpenseTypes = async () => {
      try {
        const types = await getExpenseTypes()
        setExpenseTypes(types)
      } catch (error) {
        console.error("Gider türleri yüklenirken hata:", error)
        toast({
          title: "Hata",
          description: "Gider türleri yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
      }
    }

    loadExpenseTypes()
  }, [toast])

  // Providers'ı yükle
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providersData = await getProviders()
        setProviders(providersData || [])
      } catch (error) {
        console.error("Sağlayıcılar yüklenirken hata:", error)
      }
    }

    loadProviders()
  }, [])

  const steps = [
    { id: "customer", label: "Müşteri Bilgileri" },
    { id: "tour", label: "Tur Detayları" },
    { id: "expenses", label: "Tur Giderleri" },
    { id: "activities", label: "Tur Aktiviteleri" },
    { id: "payment", label: "Ödeme Bilgileri" },
    { id: "summary", label: "Özet" },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormChanged(true);

    // Kişi başı fiyat değiştiğinde toplam fiyatı güncelle
    if (name === "pricePerPerson") {
      const totalPrice = Number.parseFloat(value) * Number.parseInt(formData.numberOfPeople.toString())
      setFormData((prev) => ({ ...prev, totalPrice: totalPrice.toString() }))
    }

    // Kişi sayısı değiştiğinde toplam fiyatı güncelle
    if (name === "numberOfPeople" && formData.pricePerPerson) {
      const totalPrice = Number.parseFloat(formData.pricePerPerson) * Number.parseInt(value)
      setFormData((prev) => ({ ...prev, totalPrice: totalPrice.toString() }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormChanged(true);
  }

  // Ek müşteri ekleme
  const addAdditionalCustomer = () => {
    const newCustomer = {
      id: uuidv4(),
      name: "",
      phone: "",
      idNumber: "",
    }

    setFormData((prev) => ({
      ...prev,
      additionalCustomers: [...prev.additionalCustomers, newCustomer],
    }))
    setFormChanged(true);
  }

  // Ek müşteri silme
  const removeAdditionalCustomer = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      additionalCustomers: prev.additionalCustomers.filter((customer) => customer.id !== id),
    }))
    setFormChanged(true);
  }

  // Ek müşteri güncelleme
  const updateAdditionalCustomer = (id: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      additionalCustomers: prev.additionalCustomers.map((customer) =>
        customer.id === id ? { ...customer, [field]: value } : customer,
      ),
    }))
    setFormChanged(true);
  }

  // Gider ekleme
  const addExpense = () => {
    const newExpense = {
      id: uuidv4(),
      type: "",
      name: "",
      provider: "",
      amount: "",
      currency: "TRY",
      details: "",
    }

    setFormData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, newExpense],
    }))
    setFormChanged(true);
  }

  // Gider silme
  const removeExpense = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((expense) => expense.id !== id),
    }))
    setFormChanged(true);
  }

  // Gider güncelleme
  const updateExpense = (id: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((expense) => (expense.id === id ? { ...expense, [field]: value } : expense)),
    }))
    setFormChanged(true);
  }

  // Aktivite ekleme
  const addActivity = () => {
    const newActivity = {
      id: uuidv4(),
      name: "",
      date: "",
      duration: "",
      price: "",
      currency: "TRY",
      provider: "",
      details: "",
      participants: 1,
    }

    setFormData((prev) => ({
      ...prev,
      activities: [...prev.activities, newActivity],
    }))
    setFormChanged(true);
  }

  // Aktivite silme
  const removeActivity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities.filter((activity) => activity.id !== id),
    }))
    setFormChanged(true);
  }

  // Aktivite güncelleme
  const updateActivity = (id: string, field: string, value: string) => {
    setFormData((prev) => {
      // Güncellenecek aktiviteyi bul
      const updatedActivities = prev.activities.map((activity) => {
        if (activity.id === id) {
          // "full" özel parametresi ile tüm aktiviteyi değiştir
          if (field === "full") {
            try {
              return JSON.parse(value) as Activity;
            } catch (e) {
              console.error("Aktivite JSON parse hatası:", e);
              return activity;
            }
          }
          
          // Normal durumda tek bir alanı güncelle
          return { ...activity, [field]: value };
        }
        return activity;
      });
      
      // Tüm fiyatları hesapla
      
      // 1. Tur temel fiyatı (kişi başı fiyat * kişi sayısı)
      const basePrice = Number(prev.pricePerPerson || 0) * Number(prev.numberOfPeople || 1);
      
      // 2. Tüm aktivite fiyatlarını topla (her aktivite için kişi başı fiyat * o aktivitenin katılımcı sayısı)
      let totalActivitiesPrice = 0;
      updatedActivities.forEach((activity) => {
        if (activity.price) {
          const activityPrice = Number(activity.price || 0);
          const participantCount = Number(activity.participants || 1);
          totalActivitiesPrice += activityPrice * participantCount;
        }
      });
      
      // 3. Toplam tur fiyatı = Tur temel fiyatı + Tüm aktivite fiyatları
      const totalPrice = basePrice + totalActivitiesPrice;
      
      // Fiyat değişikliği yapıldığında log göndererek durum kontrolü
      if (field === "price" || field === "participants") {
        console.log("Fiyat güncelleme:", {
          activityId: id, 
          field: field,
          newValue: value,
          basePrice: basePrice,
          activitiesTotal: totalActivitiesPrice,
          newTotalPrice: totalPrice
        });
      }
      
      // Güncellenmiş form verisini döndür
      return {
        ...prev,
        activities: updatedActivities,
        totalPrice: totalPrice.toString()
      };
    });
    
    // Form değiştirildi işaretleme
    setFormChanged(true);
  };

  // Toplam aktivite fiyatını hesapla
  const calculateTotalActivityPrice = useCallback((activity: Activity): number => {
    if (!activity || !activity.price) return 0;
    
    const price = parseFloat(activity.price);
    if (isNaN(price)) return 0;
    
    return price * Number(activity.participants || 1);
  }, []);

  // Her fiyat veya kişi sayısı değiştiğinde yeniden hesapla
  useEffect(() => {
    // Kişi sayısı veya kişi başı fiyat değiştiğinde toplam fiyatı güncelle
    if (formData.pricePerPerson || formData.activities.some(a => a.price)) {
      setFormData(prev => {
        // Tur temel fiyatı
        const basePrice = Number(prev.pricePerPerson || 0) * Number(prev.numberOfPeople || 1);
        
        // Aktivite fiyatları toplamı
        let totalActivitiesPrice = 0;
        prev.activities.forEach((activity) => {
          if (activity.price) {
            totalActivitiesPrice += Number(activity.price || 0) * Number(activity.participants || 1);
          }
        });
        
        // Toplam fiyat
        const totalPrice = basePrice + totalActivitiesPrice;
        
        return {
          ...prev,
          totalPrice: totalPrice.toString()
        };
      });
    }
  }, [formData.numberOfPeople, formData.pricePerPerson]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Formu gönder
    const updatedData = {
      ...formData,
      updatedAt: new Date().toISOString(),
    };
    
    onSave(updatedData);
    
    // Formu gönderdikten sonra localStorage'den temizle
    try {
      localStorage.removeItem('tourSalesFormData');
      console.log('Form verileri localStorage\'den temizlendi');
    } catch (error) {
      console.error('Form verilerini temizleme hatası:', error);
    }
    
    setFormChanged(false);
    
    // Formu sıfırla
    setFormData({
      id: uuidv4(),
      serialNumber: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      customerAddress: "",
      customerIdNumber: "",
      additionalCustomers: [],
      tourName: "",
      tourDate: new Date().toISOString().split("T")[0],
      tourEndDate: "",
      numberOfPeople: 1,
      numberOfChildren: 0,
      pricePerPerson: "",
      totalPrice: "",
      currency: "TRY",
      paymentStatus: "pending",
      paymentMethod: "cash",
      partialPaymentAmount: "",
      partialPaymentCurrency: "TRY",
      notes: "",
      expenses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activities: [],
    });
    
    // İlk adıma geri dön
    setCurrentStep(0);
  }

  // Para birimi seçenekleri
  const currencyOptions = [
    { value: "TRY", label: "Türk Lirası (₺)" },
    { value: "USD", label: "Amerikan Doları ($)" },
    { value: "EUR", label: "Euro (€)" },
    { value: "GBP", label: "İngiliz Sterlini (£)" },
  ]

  // Toplam giderleri hesapla
  const calculateTotalExpenses = () => {
    return formData.expenses.reduce((total: number, expense: any) => {
      // Tüm giderleri TRY'ye çevirerek topla (basit bir yaklaşım)
      let amount = Number.parseFloat(expense.amount) || 0

      // Döviz çevirme işlemi burada yapılabilir
      // Şimdilik basit bir yaklaşım kullanıyoruz
      if (expense.currency === "USD") amount *= 32
      if (expense.currency === "EUR") amount *= 35
      if (expense.currency === "GBP") amount *= 40

      return total + amount
    }, 0)
  }

  // Tur özeti
  const TourSummary = () => (
    <div className="space-y-6">
      {/* Yazdırma sırasında gözükecek sayfa başlığı - yeni değişiklik */}
      <div className="hidden print:flex print:mb-8 print:pt-4 print:justify-between print:items-center print:w-full">
        <div className="print:text-2xl print:font-bold">
          <img 
            src="/logo.png" 
            alt="PassionisTravel Logo" 
            className="h-12" 
          />
        </div>
        <div className="print:text-right">
          <div className="print:text-sm">{new Date().toLocaleDateString('tr-TR')}</div>
          <div className="print:text-sm">{new Date().toLocaleTimeString('tr-TR')}</div>
        </div>
      </div>

      <div className="rounded-lg border p-4 print:p-2 print:mt-8">
        <h3 className="text-lg font-medium mb-4 print:mb-2">Müşteri Bilgileri</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-sm text-muted-foreground">Ad Soyad:</span>
            <p>{formData.customerName}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Telefon:</span>
            <p>{formData.customerPhone}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">E-posta:</span>
            <p>{formData.customerEmail}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">TC/Pasaport No:</span>
            <p>{formData.customerIdNumber}</p>
          </div>
        </div>

        {formData.additionalCustomers.length > 0 && (
          <div className="mt-4 print:mt-2">
            <h4 className="text-md font-medium mb-2 print:mb-1">Ek Katılımcılar</h4>
            {formData.additionalCustomers.map((customer, index) => (
              <div key={customer.id} className="border-t pt-2 mt-2 print:pt-1 print:mt-1">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Ad Soyad:</span>
                    <p>{customer.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Telefon:</span>
                    <p>{customer.phone}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">TC/Pasaport No:</span>
                    <p>{customer.idNumber}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4 print:p-2">
        <h3 className="text-lg font-medium mb-4 print:mb-2">Tur Detayları</h3>
        <div className="grid grid-cols-2 gap-2 print:text-sm">
          <div>
            <span className="text-sm text-muted-foreground">Seri No:</span>
            <p>{formData.serialNumber}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Tur Adı:</span>
            <p>{formData.tourName}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Başlangıç Tarihi:</span>
            <p>{new Date(formData.tourDate).toLocaleDateString("tr-TR")}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Bitiş Tarihi:</span>
            <p>{formData.tourEndDate ? new Date(formData.tourEndDate).toLocaleDateString("tr-TR") : "-"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Yetişkin Sayısı:</span>
            <p>{formData.numberOfPeople}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Çocuk Sayısı:</span>
            <p>{formData.numberOfChildren}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Kişi Başı Fiyat:</span>
            <p>
              {Number(formData.pricePerPerson || 0).toLocaleString("tr-TR")} {formData.currency}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Toplam Tur Fiyatı:</span>
            <p>
              {(Number(formData.pricePerPerson || 0) * Number(formData.numberOfPeople || 0)).toLocaleString("tr-TR")} {formData.currency}
            </p>
          </div>
        </div>
      </div>

      {/* Yazdırma sırasında giderler bölümünü gösterme */}
      {formData.expenses.length > 0 && (
        <div className="rounded-lg border p-4 print:hidden">
          <h3 className="text-lg font-medium mb-4">Tur Giderleri (İç Kullanım)</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Tür</th>
                <th className="text-left py-2">Açıklama</th>
                <th className="text-left py-2">Sağlayıcı</th>
                <th className="text-right py-2">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {formData.expenses.map((expense) => (
                <tr key={expense.id} className="border-b">
                  <td className="py-2">{expense.type}</td>
                  <td className="py-2">{expense.name}</td>
                  <td className="py-2">{expense.provider}</td>
                  <td className="py-2 text-right">
                    {Number(expense.amount || 0).toLocaleString("tr-TR")} {expense.currency}
                  </td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan={3} className="py-2 text-right">
                  Toplam Gider (TRY):
                </td>
                <td className="py-2 text-right">{calculateTotalExpenses().toLocaleString("tr-TR")} TRY</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {formData.activities.length > 0 && (
        <div className="rounded-lg border p-4 print:p-2">
          <h3 className="text-lg font-medium mb-4 print:mb-2">Tur Aktiviteleri</h3>
          <table className="w-full print:text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 print:py-1">Aktivite</th>
                <th className="text-left py-2 print:py-1">Tarih</th>
                <th className="text-left py-2 print:py-1">Süre</th>
                <th className="text-right py-2 print:py-1">Kişi Başı Fiyat</th>
                <th className="text-right py-2 print:py-1">Kişi Sayısı</th>
                <th className="text-right py-2 print:py-1">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {formData.activities.map((activity) => (
                <tr key={activity.id} className="border-b">
                  <td className="py-2 print:py-1">{activity.name}</td>
                  <td className="py-2 print:py-1">{activity.date}</td>
                  <td className="py-2 print:py-1">{activity.duration}</td>
                  <td className="py-2 print:py-1 text-right">
                    {Number(activity.price || 0).toLocaleString("tr-TR")} {activity.currency}
                  </td>
                  <td className="py-2 print:py-1 text-right">
                    {activity.participants}
                  </td>
                  <td className="py-2 print:py-1 text-right">
                    {(Number(activity.price || 0) * Number(activity.participants || 1)).toLocaleString("tr-TR")} {activity.currency}
                  </td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan={5} className="py-2 print:py-1 text-right">
                  Toplam Aktivite Tutarı:
                </td>
                <td className="py-2 print:py-1 text-right">
                  {formData.activities.reduce((total, activity) => {
                    return total + (Number(activity.price || 0) * Number(activity.participants || 1));
                  }, 0).toLocaleString("tr-TR")} {formData.currency}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border p-4 bg-gray-50 print:p-2 print:bg-white">
        <h3 className="text-lg font-medium mb-4 print:mb-2">Fiyat Özeti</h3>
        <div className="grid grid-cols-2 gap-2 print:text-sm">
          <div className="col-start-1 text-right">
            <span className="text-sm text-muted-foreground">Tur Fiyatı ({formData.numberOfPeople} kişi):</span>
          </div>
          <div>
            <p>
              {(Number(formData.pricePerPerson || 0) * Number(formData.numberOfPeople || 0)).toLocaleString("tr-TR")} {formData.currency}
            </p>
          </div>
          
          {formData.activities.length > 0 && (
            <>
              <div className="col-start-1 text-right">
                <span className="text-sm text-muted-foreground">Aktiviteler Toplamı:</span>
              </div>
              <div>
                <p>
                  {formData.activities.reduce((total, activity) => {
                    return total + (Number(activity.price || 0) * Number(activity.participants || 1));
                  }, 0).toLocaleString("tr-TR")} {formData.currency}
                </p>
              </div>
            </>
          )}
          
          <div className="col-start-1 text-right font-bold">
            <span>Toplam Tutar:</span>
          </div>
          <div className="font-bold">
            <p>
              {Number(formData.totalPrice || 0).toLocaleString("tr-TR")} {formData.currency}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 print:p-2">
        <h3 className="text-lg font-medium mb-4 print:mb-2">Ödeme Bilgileri</h3>
        <div className="grid grid-cols-2 gap-2 print:text-sm">
          <div>
            <span className="text-sm text-muted-foreground">Ödeme Durumu:</span>
            <p>
              {formData.paymentStatus === "pending"
                ? "Beklemede"
                : formData.paymentStatus === "partial"
                  ? "Kısmi Ödeme"
                  : formData.paymentStatus === "completed"
                    ? "Tamamlandı"
                    : formData.paymentStatus === "refunded"
                      ? "İade Edildi"
                      : "Bilinmiyor"}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Ödeme Yöntemi:</span>
            <p>
              {formData.paymentMethod === "cash"
                ? "Nakit"
                : formData.paymentMethod === "creditCard"
                  ? "Kredi Kartı"
                  : formData.paymentMethod === "bankTransfer"
                    ? "Banka Transferi"
                    : formData.paymentMethod === "other"
                      ? "Diğer"
                      : "Bilinmiyor"}
            </p>
          </div>

          {formData.paymentStatus === "partial" && (
            <>
              <div>
                <span className="text-sm text-muted-foreground">Yapılan Ödeme:</span>
                <p>
                  {Number(formData.partialPaymentAmount || 0).toLocaleString("tr-TR")}{" "}
                  {formData.partialPaymentCurrency}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Kalan Ödeme:</span>
                <p className="font-bold">
                  {(
                    Number(formData.totalPrice || 0) - Number(formData.partialPaymentAmount || 0)
                  ).toLocaleString("tr-TR")}{" "}
                  {formData.currency}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {formData.notes && (
        <div className="rounded-lg border p-4 print:p-2">
          <h3 className="text-lg font-medium mb-2 print:mb-1">Notlar</h3>
          <p className="whitespace-pre-line print:text-sm">{formData.notes}</p>
        </div>
      )}

      {/* Yazdırma sırasında footer bilgisi göster - yeni düzenleme */}
      <div className="hidden print:block print:fixed print:bottom-2 print:left-0 print:w-full print:text-center print:text-xs print:border-t print:pt-2 print:pb-2">
        Bu belge PassionisTravel tarafından düzenlenmiştir. İletişim: +90 212 123 4567 | info@passionistour.com
      </div>

      <div className="flex justify-between mt-6 print:hidden">
        <Button type="button" variant="outline" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>

        <div className="space-x-2">
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Yazdır
          </Button>

          <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={() => setIsConfirmDialogOpen(true)}>
            <Save className="mr-2 h-4 w-4" />
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-[#00a1c6]">{initialData ? "Tur Satışını Düzenle" : "Yeni Tur Satışı"}</CardTitle>
      </CardHeader>

      {/* Head kısmına yazdırma stilleri ekleyelim */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 1.5cm 1cm;
            size: A4 portrait;
          }
          body {
            font-size: 11pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:text-sm {
            font-size: 9pt !important;
          }
          .print\\:p-2 {
            padding: 0.3rem !important;
          }
          .print\\:mb-2 {
            margin-bottom: 0.3rem !important;
          }
          .print\\:mb-1 {
            margin-bottom: 0.15rem !important;
          }
          .print\\:mb-8 {
            margin-bottom: 1.5rem !important;
          }
          .print\\:mt-8 {
            margin-top: 1.5rem !important;
          }
          .print\\:py-1 {
            padding-top: 0.15rem !important;
            padding-bottom: 0.15rem !important;
          }
          .print\\:mt-1 {
            margin-top: 0.15rem !important;
          }
          .print\\:pt-1 {
            padding-top: 0.15rem !important;
          }
          .print\\:pt-2 {
            padding-top: 0.3rem !important;
          }
          .print\\:pt-4 {
            padding-top: 1rem !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:fixed {
            position: fixed !important;
          }
          .print\\:bottom-4 {
            bottom: 1rem !important;
          }
          .print\\:left-0 {
            left: 0 !important;
          }
          .print\\:w-full {
            width: 100% !important;
          }
          .print\\:text-center {
            text-align: center !important;
          }
          .print\\:text-xs {
            font-size: 8pt !important;
          }
          .print\\:border-t {
            border-top-width: 1px !important;
            border-top-style: solid !important;
            border-top-color: #e5e7eb !important;
          }
          table {
            page-break-inside: avoid;
          }
          tr {
            page-break-inside: avoid;
          }
          td {
            page-break-inside: avoid;
          }
          h3, h4 {
            page-break-after: avoid;
          }
          .rounded-lg {
            border-radius: 0.25rem !important;
          }
          .border {
            border-width: 1px !important;
            border-style: solid !important;
            border-color: #e5e7eb !important;
          }
        }
      `}</style>

      <form onSubmit={(e) => e.preventDefault()}>
        <CardContent>
          {/* İlerleme Adımları */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${index <= currentStep ? "text-[#00a1c6]" : "text-gray-400"} cursor-pointer`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      index < currentStep
                        ? "bg-[#00a1c6] text-white"
                        : index === currentStep
                          ? "border-2 border-[#00a1c6] text-[#00a1c6]"
                          : "border-2 border-gray-300 text-gray-400"
                    }`}
                  >
                    {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className="text-xs text-center">{step.label}</span>
                </div>
              ))}
            </div>
            <div className="relative mt-2">
              <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full"></div>
              <div
                className="absolute top-0 left-0 h-1 bg-[#00a1c6] transition-all"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Adım 1: Müşteri Bilgileri */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Müşteri Adı Soyadı</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="Müşteri adını girin"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Telefon</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="Telefon numarası"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">E-posta</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="E-posta adresi"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerAddress">Adres</Label>
                <Textarea
                  id="customerAddress"
                  name="customerAddress"
                  value={formData.customerAddress}
                  onChange={handleChange}
                  placeholder="Adres bilgisi"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerIdNumber">T.C. Kimlik / Pasaport No</Label>
                <Input
                  id="customerIdNumber"
                  name="customerIdNumber"
                  value={formData.customerIdNumber}
                  onChange={handleChange}
                  placeholder="Kimlik numarası"
                />
              </div>

              {/* Ek Katılımcılar */}
              <div className="space-y-2 mt-6">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Ek Katılımcılar</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAdditionalCustomer}>
                    <Plus className="h-4 w-4 mr-2" />
                    Katılımcı Ekle
                  </Button>
                </div>

                {formData.additionalCustomers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground border rounded-md">
                    Henüz ek katılımcı eklenmemiş
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.additionalCustomers.map((customer, index) => (
                      <Card key={customer.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">Katılımcı {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAdditionalCustomer(customer.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Ad Soyad</Label>
                            <Input
                              value={customer.name}
                              onChange={(e) => updateAdditionalCustomer(customer.id, "name", e.target.value)}
                              placeholder="Ad soyad"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Telefon</Label>
                            <Input
                              value={customer.phone}
                              onChange={(e) => updateAdditionalCustomer(customer.id, "phone", e.target.value)}
                              placeholder="Telefon numarası"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>T.C. Kimlik / Pasaport No</Label>
                            <Input
                              value={customer.idNumber}
                              onChange={(e) => updateAdditionalCustomer(customer.id, "idNumber", e.target.value)}
                              placeholder="Kimlik numarası"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                  İleri
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Adım 2: Tur Detayları */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Seri Numarası</Label>
                  <Input
                    id="serialNumber"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    placeholder="Tur seri numarası"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tourName">Tur Adı</Label>
                  <Input
                    id="tourName"
                    name="tourName"
                    value={formData.tourName}
                    onChange={handleChange}
                    placeholder="Tur adını girin"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tourDate">Başlangıç Tarihi</Label>
                  <Input
                    id="tourDate"
                    name="tourDate"
                    type="date"
                    value={formData.tourDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tourEndDate">Bitiş Tarihi</Label>
                  <Input
                    id="tourEndDate"
                    name="tourEndDate"
                    type="date"
                    value={formData.tourEndDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfPeople">Yetişkin Sayısı</Label>
                  <Input
                    id="numberOfPeople"
                    name="numberOfPeople"
                    type="number"
                    min="1"
                    value={formData.numberOfPeople}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfChildren">Çocuk Sayısı</Label>
                  <Input
                    id="numberOfChildren"
                    name="numberOfChildren"
                    type="number"
                    min="0"
                    value={formData.numberOfChildren}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerPerson">Kişi Başı Fiyat</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pricePerPerson"
                      name="pricePerPerson"
                      type="number"
                      step="0.01"
                      value={formData.pricePerPerson}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                    />
                    <Select value={formData.currency} onValueChange={(value) => handleSelectChange("currency", value)}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Para birimi" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalPrice">Toplam Fiyat</Label>
                  <Input
                    id="totalPrice"
                    name="totalPrice"
                    type="number"
                    step="0.01"
                    value={formData.totalPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Ek notlar"
                  rows={3}
                />
              </div>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri
                </Button>

                <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                  İleri
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Adım 3: Tur Giderleri */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Tur Giderleri</h3>
                <Button type="button" variant="outline" size="sm" onClick={addExpense}>
                  <Plus className="h-4 w-4 mr-2" />
                  Gider Ekle
                </Button>
              </div>

              {formData.expenses.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border rounded-md">Henüz gider eklenmemiş</div>
              ) : (
                <div className="space-y-4">
                  {formData.expenses.map((expense, index) => (
                    <Card key={expense.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">Gider {index + 1}</h4>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeExpense(expense.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Gider Türü</Label>
                          <Select
                            value={expense.type}
                            onValueChange={(value) => updateExpense(expense.id, "type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Gider türü seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="accommodation">Konaklama</SelectItem>
                              <SelectItem value="transportation">Ulaşım</SelectItem>
                              <SelectItem value="transfer">Transfer</SelectItem>
                              <SelectItem value="guide">Rehber</SelectItem>
                              <SelectItem value="agency">Acente</SelectItem>
                              <SelectItem value="porter">Hanutçu</SelectItem>
                              <SelectItem value="meal">Yemek</SelectItem>
                              <SelectItem value="activity">Aktivite</SelectItem>
                              <SelectItem value="other">Diğer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Açıklama</Label>
                          <Input
                            value={expense.name}
                            onChange={(e) => updateExpense(expense.id, "name", e.target.value)}
                            placeholder="Gider açıklaması"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Sağlayıcı</Label>
                          <Select
                            value={expense.provider}
                            onValueChange={(value) => updateExpense(expense.id, "provider", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sağlayıcı seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {providers.map((provider) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  {provider.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Tutar</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={expense.amount}
                              onChange={(e) => updateExpense(expense.id, "amount", e.target.value)}
                              placeholder="0.00"
                            />
                            <Select
                              value={expense.currency}
                              onValueChange={(value) => updateExpense(expense.id, "currency", value)}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Para birimi" />
                              </SelectTrigger>
                              <SelectContent>
                                {currencyOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <Label>Detaylar</Label>
                        <Input
                          value={expense.details}
                          onChange={(e) => updateExpense(expense.id, "details", e.target.value)}
                          placeholder="Ek bilgiler"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri
                </Button>

                <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                  İleri
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Adım 4: Tur Aktiviteleri */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Tur Aktiviteleri</h3>
                <Button type="button" variant="outline" size="sm" onClick={addActivity}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aktivite Ekle
                </Button>
              </div>

              {formData.activities.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border rounded-md">
                  Henüz aktivite eklenmemiş
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.activities.map((activity, index) => (
                    <Card key={activity.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">Aktivite {index + 1}</h4>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeActivity(activity.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Aktivite Adı</Label>
                          <Input
                            value={activity.name}
                            onChange={(e) => updateActivity(activity.id, "name", e.target.value)}
                            placeholder="Aktivite adı"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tarih</Label>
                          <Input
                            type="date"
                            value={activity.date}
                            onChange={(e) => updateActivity(activity.id, "date", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Süre</Label>
                          <Input
                            value={activity.duration}
                            onChange={(e) => updateActivity(activity.id, "duration", e.target.value)}
                            placeholder="2 saat, Tam gün vb."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Kişi Başı Fiyat</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={activity.price}
                              onChange={(e) => updateActivity(activity.id, "price", e.target.value)}
                              placeholder="0.00"
                            />
                            <Select
                              value={activity.currency}
                              onValueChange={(value) => updateActivity(activity.id, "currency", value)}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Para birimi" />
                              </SelectTrigger>
                              <SelectContent>
                                {currencyOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Katılımcı Sayısı</Label>
                          <Input
                            type="number"
                            min="1"
                            max={formData.numberOfPeople}
                            value={activity.participants || 1}
                            onChange={(e) => updateActivity(activity.id, "participants", e.target.value)}
                            placeholder="Aktiviteye katılacak kişi sayısı"
                          />
                          <p className="text-xs text-muted-foreground">
                            Turdaki toplam {formData.numberOfPeople} kişiden kaç kişi katılacak?
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Toplam Aktivite Fiyatı</Label>
                          <p className="p-2 border rounded-md">
                            {(Number(activity.price || 0) * Number(activity.participants || 1)).toLocaleString('tr-TR')} {activity.currency}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.price || 0} x {activity.participants || 1} kişi = Toplam {(Number(activity.price || 0) * Number(activity.participants || 1)).toLocaleString('tr-TR')} {activity.currency}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Sağlayıcı</Label>
                          <Select
                            value={activity.provider}
                            onValueChange={(value) => updateActivity(activity.id, "provider", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sağlayıcı seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {providers.map((provider) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  {provider.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Detaylar</Label>
                          <Input
                            value={activity.details}
                            onChange={(e) => updateActivity(activity.id, "details", e.target.value)}
                            placeholder="Ek bilgiler"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri
                </Button>

                <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                  İleri
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Adım 5: Ödeme Bilgileri */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Ödeme Durumu</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) => handleSelectChange("paymentStatus", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ödeme durumu seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="partial">Kısmi Ödeme</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="refunded">İade Edildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.paymentStatus === "partial" && (
                <div className="space-y-2">
                  <Label htmlFor="partialPaymentAmount">Yapılan Ödeme Tutarı</Label>
                  <div className="flex gap-2">
                    <Input
                      id="partialPaymentAmount"
                      name="partialPaymentAmount"
                      type="number"
                      step="0.01"
                      value={formData.partialPaymentAmount}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                    />
                    <Select
                      value={formData.partialPaymentCurrency}
                      onValueChange={(value) => handleSelectChange("partialPaymentCurrency", value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Para birimi" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Ödeme Yöntemi</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => handleSelectChange("paymentMethod", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ödeme yöntemi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Nakit</SelectItem>
                    <SelectItem value="creditCard">Kredi Kartı</SelectItem>
                    <SelectItem value="bankTransfer">Banka Transferi</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri
                </Button>

                <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={nextStep}>
                  İleri
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Adım 6: Özet */}
          {currentStep === 5 && <TourSummary />}
        </CardContent>
      </form>

      {/* Onay Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tur Satışını Kaydet</AlertDialogTitle>
            <AlertDialogDescription>Tur satış bilgilerini kaydetmek istediğinize emin misiniz?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction className="bg-teal-600 hover:bg-teal-700" onClick={handleSubmit}>
              Kaydet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

