"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { useToast } from "@/components/ui/use-toast"
import { Save, Upload, Building, CreditCard, Printer, Settings, Plus, Trash2, Edit, Users, Pencil, Trash } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { getSettings, saveSettings, getExpenseTypes, saveExpenseTypes, getProviders, saveProviders, getActivities, saveActivities } from "@/lib/db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/data-utils"

export function SettingsView({ onClose }) {
  const { toast } = useToast()
  const [companyInfo, setCompanyInfo] = useState({
    name: "PassionisTravel",
    address: "Örnek Mahallesi, Örnek Caddesi No:123, İstanbul",
    phone: "+90 212 123 4567",
    email: "info@passionistour.com",
    taxId: "1234567890",
    website: "www.passionistour.com",
    logo: null,
  })

  const [preferences, setPreferences] = useState({
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
  })

  const [invoiceSettings, setInvoiceSettings] = useState({
    companyNameOnInvoice: true,
    showLogo: true,
    invoicePrefix: "INV",
    nextInvoiceNumber: "1001",
    termsAndConditions: "Ödeme, fatura tarihinden itibaren 30 gün içinde yapılmalıdır.",
    invoiceNotes: "Teşekkür ederiz!",
    bankDetails: "Banka: XYZ Bank\nIBAN: TR00 0000 0000 0000 0000 0000 00\nŞube: Merkez",
  })

  const [userSettings, setUserSettings] = useState({
    fullName: "Admin Kullanıcı",
    email: "admin@passionistour.com",
    role: "admin",
    password: "********",
    newPassword: "",
    confirmPassword: "",
  })

  const [users, setUsers] = useState([
    { id: 1, name: "Admin Kullanıcı", email: "admin@passionistour.com", role: "admin", active: true },
    { id: 2, name: "Satış Temsilcisi", email: "sales@passionistour.com", role: "sales", active: true },
    { id: 3, name: "Muhasebe", email: "finance@passionistour.com", role: "finance", active: false },
  ])

  const [expenseTypes, setExpenseTypes] = useState([])
  const [newExpenseType, setNewExpenseType] = useState({
    id: "",
    type: "",
    name: "",
    description: "",
  })
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isEditingExpense, setIsEditingExpense] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState(null)

  // Sağlayıcılar için state
  const [providers, setProviders] = useState([])
  const [newProvider, setNewProvider] = useState({
    id: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  })
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false)
  const [isEditingProvider, setIsEditingProvider] = useState(false)
  const [isDeleteProviderDialogOpen, setIsDeleteProviderDialogOpen] = useState(false)
  const [providerToDelete, setProviderToDelete] = useState(null)

  // Aktiviteler için state
  const [activities, setActivities] = useState<any[]>([])
  const [newActivity, setNewActivity] = useState({
    id: "",
    name: "",
    description: "",
    providerId: "",
    price: "",
    duration: "",
    capacity: "",
  })
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)
  const [isEditingActivity, setIsEditingActivity] = useState(false)
  const [isDeleteActivityDialogOpen, setIsDeleteActivityDialogOpen] = useState(false)
  const [activityToDelete, setActivityToDelete] = useState(null)

  // Ayarları ve gider türlerini yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings()
        if (settings.companyInfo) setCompanyInfo(settings.companyInfo)
        if (settings.preferences) setPreferences(settings.preferences)
        if (settings.invoiceSettings) setInvoiceSettings(settings.invoiceSettings)
        if (settings.userSettings) setUserSettings(settings.userSettings)
        if (settings.users) setUsers(settings.users)
      } catch (error) {
        console.error("Ayarlar yüklenirken hata:", error)
      }

      try {
        const types = await getExpenseTypes()
        setExpenseTypes(types)
      } catch (error) {
        console.error("Gider türleri yüklenirken hata:", error)
      }
    }

    const loadProviders = async () => {
      try {
        const providersData = await getProviders()
        if (providersData) setProviders(providersData)
      } catch (error) {
        console.error("Sağlayıcılar yüklenirken hata:", error)
      }
    }

    const loadActivities = async () => {
      try {
        const activitiesData = await getActivities()
        if (activitiesData) setActivities(activitiesData)
      } catch (error) {
        console.error("Aktiviteler yüklenirken hata:", error)
      }
    }

    loadSettings()
    loadProviders()
    loadActivities()
  }, [])

  const handleCompanyInfoChange = (e) => {
    const { name, value } = e.target
    setCompanyInfo((prev) => ({ ...prev, [name]: value }))
  }

  const handlePreferenceChange = (name, value) => {
    setPreferences((prev) => ({ ...prev, [name]: value }))
  }

  const handleInvoiceSettingChange = (e) => {
    const { name, value } = e.target
    setInvoiceSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleInvoiceToggleChange = (name, value) => {
    setInvoiceSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleUserSettingChange = (e) => {
    const { name, value } = e.target
    setUserSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCompanyInfo((prev) => ({ ...prev, logo: e.target.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveSettings = async () => {
    try {
      // Tüm verileri kaydet
      const settingsData = {
        companyInfo,
        preferences,
        userSettings,
        users,
        id: "app-settings" // IndexedDB'nin ID gereksinimleri için
      };
      
      await saveSettings(settingsData);
      
      // Ayrıca doğrudan localStorage'a da kaydedelim ki tarayıcı kapanıp açıldığında veriler kaybolmasın
      localStorage.setItem("preferences", JSON.stringify(preferences));
      localStorage.setItem("companyInfo", JSON.stringify(companyInfo));
      
      // Tercih değişikliklerini uygulama genelinde yansıtmak için
      // localStorage event trigger edelim
      window.dispatchEvent(new Event('storage'));

      toast({
        title: "Ayarlar kaydedildi",
        description: "Tüm ayarlarınız başarıyla güncellendi.",
      });
      
      // Kullanıcıya değişikliklerin hemen görünür olması için sayfayı yenileme seçeneği sun
      if (confirm("Değişikliklerin hemen uygulanması için sayfa yenilensin mi?")) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Ayarlar kaydedilirken hata:", error);
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  }

  const handleSaveUserSettings = () => {
    // Şifre kontrolü
    if (userSettings.newPassword && userSettings.newPassword !== userSettings.confirmPassword) {
      toast({
        title: "Hata",
        description: "Yeni şifreler eşleşmiyor.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Kullanıcı ayarları kaydedildi",
      description: "Kullanıcı bilgileriniz başarıyla güncellendi.",
    })
  }

  const handleToggleUserStatus = (userId) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, active: !user.active } : user)))
  }

  // Gider türü ekleme/düzenleme dialog'unu aç
  const openExpenseDialog = (expense = null) => {
    if (expense) {
      setNewExpenseType(expense)
      setIsEditingExpense(true)
    } else {
      setNewExpenseType({
        id: uuidv4(),
        type: "",
        name: "",
        description: "",
      })
      setIsEditingExpense(false)
    }
    setIsExpenseDialogOpen(true)
  }

  // Gider türü değişikliklerini işle
  const handleExpenseTypeChange = (e) => {
    const { name, value } = e.target
    setNewExpenseType((prev) => ({ ...prev, [name]: value }))
  }

  // Gider türü kaydet
  const handleSaveExpenseType = () => {
    if (!newExpenseType.type || !newExpenseType.name) {
      toast({
        title: "Hata",
        description: "Tür ve isim alanları zorunludur.",
        variant: "destructive",
      })
      return
    }

    if (isEditingExpense) {
      // Mevcut gider türünü güncelle
      setExpenseTypes((prev) => prev.map((item) => (item.id === newExpenseType.id ? newExpenseType : item)))
    } else {
      // Yeni gider türü ekle
      setExpenseTypes((prev) => [...prev, newExpenseType])
    }

    setIsExpenseDialogOpen(false)
  }

  // Gider türü silme dialog'unu aç
  const openDeleteExpenseDialog = (expense) => {
    setExpenseToDelete(expense)
    setIsDeleteDialogOpen(true)
  }

  // Gider türü sil
  const handleDeleteExpenseType = () => {
    setExpenseTypes((prev) => prev.filter((item) => item.id !== expenseToDelete.id))
    setIsDeleteDialogOpen(false)
  }

  // Gider türlerini kaydet
  const handleSaveExpenseTypes = async () => {
    try {
      await saveExpenseTypes(expenseTypes)

      toast({
        title: "Gider türleri kaydedildi",
        description: "Gider türleri başarıyla güncellendi.",
      })
    } catch (error) {
      console.error("Gider türleri kaydedilirken hata:", error)
      toast({
        title: "Hata",
        description: "Gider türleri kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  // Sağlayıcı ekleme/düzenleme dialog'unu aç
  const openProviderDialog = (provider = null) => {
    if (provider) {
      setNewProvider(provider)
      setIsEditingProvider(true)
    } else {
      setNewProvider({
        id: uuidv4(),
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
      })
      setIsEditingProvider(false)
    }
    setIsProviderDialogOpen(true)
  }

  // Sağlayıcı değişikliklerini işle
  const handleProviderChange = (e) => {
    const { name, value } = e.target
    setNewProvider((prev) => ({ ...prev, [name]: value }))
  }

  // Sağlayıcı kaydet
  const handleSaveProvider = () => {
    if (!newProvider.name) {
      toast({
        title: "Hata",
        description: "Firma adı alanı zorunludur.",
        variant: "destructive",
      })
      return
    }

    if (isEditingProvider) {
      // Mevcut sağlayıcıyı güncelle
      setProviders((prev) => prev.map((item) => (item.id === newProvider.id ? newProvider : item)))
    } else {
      // Yeni sağlayıcı ekle
      setProviders((prev) => [...prev, newProvider])
    }

    setIsProviderDialogOpen(false)
  }

  // Sağlayıcı silme dialog'unu aç
  const openDeleteProviderDialog = (provider) => {
    setProviderToDelete(provider)
    setIsDeleteProviderDialogOpen(true)
  }

  // Sağlayıcı sil
  const handleDeleteProvider = () => {
    setProviders((prev) => prev.filter((item) => item.id !== providerToDelete.id))
    setIsDeleteProviderDialogOpen(false)
  }

  // Sağlayıcıları kaydet
  const handleSaveProviders = async () => {
    try {
      await saveProviders(providers)

      toast({
        title: "Sağlayıcılar kaydedildi",
        description: "Sağlayıcılar başarıyla güncellendi.",
      })
    } catch (error) {
      console.error("Sağlayıcılar kaydedilirken hata:", error)
      toast({
        title: "Hata",
        description: "Sağlayıcılar kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  // Aktiviteler işlemleri
  const handleAddActivity = () => {
    setNewActivity({
      id: "",
      name: "",
      description: "",
      providerId: "",
      price: "",
      duration: "",
      capacity: "",
    })
    setIsEditingActivity(false)
    setIsActivityDialogOpen(true)
  }

  const handleEditActivity = (activity) => {
    setNewActivity({
      ...activity,
    })
    setIsEditingActivity(true)
    setIsActivityDialogOpen(true)
  }

  const handleSaveActivity = () => {
    if (isEditingActivity) {
      // Mevcut aktiviteyi güncelle
      setActivities((prev) =>
        prev.map((item) => (item.id === newActivity.id ? newActivity : item))
      )
    } else {
      // Yeni aktivite ekle
      const newId = Date.now().toString()
      setActivities((prev) => [...prev, { ...newActivity, id: newId }])
    }
    setIsActivityDialogOpen(false)
  }

  const handleDeleteActivityClick = (activity) => {
    setActivityToDelete(activity)
    setIsDeleteActivityDialogOpen(true)
  }

  const handleDeleteActivity = () => {
    setActivities((prev) => prev.filter((item) => item.id !== activityToDelete.id))
    setIsDeleteActivityDialogOpen(false)
  }

  const handleSaveActivities = async () => {
    try {
      await saveActivities(activities)

      toast({
        title: "Aktiviteler kaydedildi",
        description: "Aktiviteler başarıyla güncellendi.",
      })
    } catch (error) {
      console.error("Aktiviteler kaydedilirken hata:", error)
      toast({
        title: "Hata",
        description: "Aktiviteler kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  // Aktivite değişikliği
  const handleActivityChange = (e: any) => {
    const { name, value } = e.target
    setNewActivity((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[#2b3275]">Ayarlar</CardTitle>
        <Button variant="outline" onClick={onClose}>
          Kapat
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="company">
          <TabsList className="mb-4 grid grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="company">
              <Building className="h-4 w-4 mr-2" />
              Şirket
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Settings className="h-4 w-4 mr-2" />
              Tercihler
            </TabsTrigger>
            <TabsTrigger value="providers">
              <Users className="h-4 w-4 mr-2" />
              Sağlayıcılar
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <CreditCard className="h-4 w-4 mr-2" />
              Gider Türleri
            </TabsTrigger>
          </TabsList>

          {/* Şirket Bilgileri */}
          <TabsContent value="company" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Şirket Adı</Label>
                <Input id="name" name="name" value={companyInfo.name} onChange={handleCompanyInfoChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Vergi Numarası</Label>
                <Input id="taxId" name="taxId" value={companyInfo.taxId} onChange={handleCompanyInfoChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adres</Label>
              <Textarea
                id="address"
                name="address"
                value={companyInfo.address}
                onChange={handleCompanyInfoChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" value={companyInfo.phone} onChange={handleCompanyInfoChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={companyInfo.email}
                  onChange={handleCompanyInfoChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Web Sitesi</Label>
              <Input id="website" name="website" value={companyInfo.website} onChange={handleCompanyInfoChange} />
            </div>

            <div className="space-y-2">
              <Label>Şirket Logosu</Label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 border rounded flex items-center justify-center bg-gray-100 overflow-hidden">
                  {companyInfo.logo ? (
                    <img
                      src={companyInfo.logo || "/placeholder.svg"}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-muted-foreground">Logo</span>
                  )}
                </div>
                <div>
                  <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <Button variant="outline" onClick={() => document.getElementById("logo").click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Logo Yükle
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveSettings} className="bg-[#2b3275] hover:bg-[#00a1c6]">
                <Save className="h-4 w-4 mr-2" />
                Şirket Bilgilerini Kaydet
              </Button>
            </div>
          </TabsContent>

          {/* Tercihler */}
          <TabsContent value="preferences" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Karanlık Mod</h3>
                  <p className="text-sm text-muted-foreground">Uygulamayı karanlık modda görüntüle</p>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => handlePreferenceChange("darkMode", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Bildirimler</h3>
                  <p className="text-sm text-muted-foreground">Önemli olaylar için bildirim al</p>
                </div>
                <Switch
                  checked={preferences.notifications}
                  onCheckedChange={(checked) => handlePreferenceChange("notifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Otomatik Yedekleme</h3>
                  <p className="text-sm text-muted-foreground">Verileri günlük olarak otomatik yedekle</p>
                </div>
                <Switch
                  checked={preferences.autoBackup}
                  onCheckedChange={(checked) => handlePreferenceChange("autoBackup", checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Dil</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => handlePreferenceChange("language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Dil seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">Türkçe</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Varsayılan Para Birimi</Label>
                  <Select
                    value={preferences.defaultCurrency}
                    onValueChange={(value) => handlePreferenceChange("defaultCurrency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Para birimi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">Türk Lirası (₺)</SelectItem>
                      <SelectItem value="USD">Amerikan Doları ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">İngiliz Sterlini (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">Tarih Formatı</Label>
                <Select
                  value={preferences.dateFormat}
                  onValueChange={(value) => handlePreferenceChange("dateFormat", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tarih formatı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD.MM.YYYY">31.12.2023</SelectItem>
                    <SelectItem value="MM/DD/YYYY">12/31/2023</SelectItem>
                    <SelectItem value="YYYY-MM-DD">2023-12-31</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Otomatik KDV Hesaplama</h3>
                  <p className="text-sm text-muted-foreground">Fiyatlara otomatik KDV ekle</p>
                </div>
                <Switch
                  checked={preferences.autoCalculateTax}
                  onCheckedChange={(checked) => handlePreferenceChange("autoCalculateTax", checked)}
                />
              </div>

              {preferences.autoCalculateTax && (
                <div className="space-y-2">
                  <Label htmlFor="taxRate">KDV Oranı (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    value={preferences.taxRate}
                    onChange={(e) => handlePreferenceChange("taxRate", e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Fiyatları KDV Dahil Göster</h3>
                  <p className="text-sm text-muted-foreground">Fiyatları KDV dahil olarak göster</p>
                </div>
                <Switch
                  checked={preferences.showPricesWithTax}
                  onCheckedChange={(checked) => handlePreferenceChange("showPricesWithTax", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Fiyatları Yuvarla</h3>
                  <p className="text-sm text-muted-foreground">Fiyatları en yakın tam sayıya yuvarla</p>
                </div>
                <Switch
                  checked={preferences.roundPrices}
                  onCheckedChange={(checked) => handlePreferenceChange("roundPrices", checked)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveSettings} className="bg-[#2b3275] hover:bg-[#00a1c6]">
                <Save className="h-4 w-4 mr-2" />
                Tercihleri Kaydet
              </Button>
            </div>
          </TabsContent>

          {/* Sağlayıcılar */}
          <TabsContent value="providers" className="space-y-4">
            <div className="flex justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium">Sağlayıcılar</h3>
                <p className="text-sm text-muted-foreground">Tur ve aktivite sağlayıcılarını yönetin</p>
              </div>
              <Button onClick={openProviderDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Sağlayıcı
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma Adı</TableHead>
                    <TableHead>İletişim Kişisi</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.length > 0 ? (
                    providers.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell className="font-medium">{provider.name}</TableCell>
                        <TableCell>{provider.contactPerson}</TableCell>
                        <TableCell>{provider.phone}</TableCell>
                        <TableCell>{provider.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openProviderDialog(provider)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteProviderDialog(provider)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Henüz sağlayıcı eklenmemiş
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-8 border-t pt-4">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">Aktiviteler</h3>
                  <p className="text-sm text-muted-foreground">Turlarda sunulan aktiviteleri yönetin</p>
                </div>
                <Button onClick={handleAddActivity}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Aktivite
                </Button>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aktivite Adı</TableHead>
                      <TableHead>Sağlayıcı</TableHead>
                      <TableHead>Fiyat</TableHead>
                      <TableHead>Süre</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.length > 0 ? (
                      activities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="font-medium">{activity.name}</TableCell>
                          <TableCell>
                            {providers.find(p => p.id === activity.providerId)?.name || "Belirtilmemiş"}
                          </TableCell>
                          <TableCell>{formatCurrency(activity.price, 'TRY')}</TableCell>
                          <TableCell>{activity.duration} {activity.duration ? 'saat' : ''}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditActivity(activity)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteActivityClick(activity)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          Henüz aktivite eklenmemiş
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveActivities} className="bg-[#2b3275] hover:bg-[#00a1c6]">
                  <Save className="h-4 w-4 mr-2" />
                  Aktiviteleri Kaydet
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Gider Türleri */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Tur İçerikleri ve Gider Türleri</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => openExpenseDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Ekle
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card className="p-4">
                <h3 className="text-md font-medium mb-4">Konaklama Türleri</h3>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      openExpenseDialog({
                        id: uuidv4(),
                        type: "accommodation",
                        name: "",
                        description: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Konaklama Türü Ekle
                  </Button>

                  {expenseTypes
                    .filter((item) => item.type === "accommodation")
                    .map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <p className="font-medium">{expense.name}</p>
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openExpenseDialog(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteExpenseDialog(expense)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-md font-medium mb-4">Ulaşım Türleri</h3>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      openExpenseDialog({
                        id: uuidv4(),
                        type: "transportation",
                        name: "",
                        description: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Ulaşım Türü Ekle
                  </Button>

                  {expenseTypes
                    .filter((item) => item.type === "transportation")
                    .map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <p className="font-medium">{expense.name}</p>
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openExpenseDialog(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteExpenseDialog(expense)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card className="p-4">
                <h3 className="text-md font-medium mb-4">Transfer Türleri</h3>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      openExpenseDialog({
                        id: uuidv4(),
                        type: "transfer",
                        name: "",
                        description: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Transfer Türü Ekle
                  </Button>

                  {expenseTypes
                    .filter((item) => item.type === "transfer")
                    .map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <p className="font-medium">{expense.name}</p>
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openExpenseDialog(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteExpenseDialog(expense)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-md font-medium mb-4">Rehber Türleri</h3>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      openExpenseDialog({
                        id: uuidv4(),
                        type: "guide",
                        name: "",
                        description: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Rehber Türü Ekle
                  </Button>

                  {expenseTypes
                    .filter((item) => item.type === "guide")
                    .map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <p className="font-medium">{expense.name}</p>
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openExpenseDialog(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteExpenseDialog(expense)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="text-md font-medium mb-4">Aktivite Türleri</h3>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      openExpenseDialog({
                        id: uuidv4(),
                        type: "activity",
                        name: "",
                        description: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Aktivite Türü Ekle
                  </Button>

                  {expenseTypes
                    .filter((item) => item.type === "activity")
                    .map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <p className="font-medium">{expense.name}</p>
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openExpenseDialog(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteExpenseDialog(expense)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-md font-medium mb-4">Diğer Gider Türleri</h3>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      openExpenseDialog({
                        id: uuidv4(),
                        type: "other",
                        name: "",
                        description: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Gider Türü Ekle
                  </Button>

                  {expenseTypes
                    .filter(
                      (item) =>
                        item.type === "other" ||
                        !["accommodation", "transportation", "transfer", "guide", "activity"].includes(item.type),
                    )
                    .map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <p className="font-medium">{expense.name}</p>
                          <p className="text-sm text-muted-foreground">{expense.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openExpenseDialog(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteExpenseDialog(expense)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveExpenseTypes} className="bg-[#2b3275] hover:bg-[#00a1c6]">
                <Save className="h-4 w-4 mr-2" />
                Tüm Değişiklikleri Kaydet
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Gider Türü Ekleme/Düzenleme Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingExpense ? "Gider Türünü Düzenle" : "Yeni Gider Türü Ekle"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expenseType">Gider Türü</Label>
              <Select
                value={newExpenseType.type}
                onValueChange={(value) => setNewExpenseType((prev) => ({ ...prev, type: value }))}
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
              <Label htmlFor="expenseName">İsim</Label>
              <Input
                id="expenseName"
                name="name"
                value={newExpenseType.name}
                onChange={handleExpenseTypeChange}
                placeholder="Gider türü ismi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenseDescription">Açıklama</Label>
              <Textarea
                id="expenseDescription"
                name="description"
                value={newExpenseType.description}
                onChange={handleExpenseTypeChange}
                placeholder="Gider türü açıklaması"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
              İptal
            </Button>
            <Button className="bg-[#2b3275] hover:bg-[#00a1c6]" onClick={handleSaveExpenseType}>
              {isEditingExpense ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gider Türü Silme Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gider Türünü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu gider türünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteExpenseType}>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sağlayıcı Ekleme/Düzenleme Dialog */}
      <Dialog open={isProviderDialogOpen} onOpenChange={setIsProviderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingProvider ? "Sağlayıcıyı Düzenle" : "Yeni Sağlayıcı Ekle"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="providerName">Firma Adı</Label>
              <Input
                id="providerName"
                name="name"
                value={newProvider.name}
                onChange={handleProviderChange}
                placeholder="Firma adı"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">İletişim Kişisi</Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                value={newProvider.contactPerson}
                onChange={handleProviderChange}
                placeholder="İletişim kişisi"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={newProvider.phone}
                  onChange={handleProviderChange}
                  placeholder="Telefon numarası"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  name="email"
                  value={newProvider.email}
                  onChange={handleProviderChange}
                  placeholder="E-posta adresi"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adres</Label>
              <Textarea
                id="address"
                name="address"
                value={newProvider.address}
                onChange={handleProviderChange}
                placeholder="Adres"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                name="notes"
                value={newProvider.notes}
                onChange={handleProviderChange}
                placeholder="Ek notlar"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProviderDialogOpen(false)}>
              İptal
            </Button>
            <Button className="bg-[#2b3275] hover:bg-[#00a1c6]" onClick={handleSaveProvider}>
              {isEditingProvider ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sağlayıcı Silme Dialog */}
      <AlertDialog open={isDeleteProviderDialogOpen} onOpenChange={setIsDeleteProviderDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sağlayıcıyı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu sağlayıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteProvider}>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Aktivite Ekleme/Düzenleme Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingActivity ? "Aktivite Düzenle" : "Yeni Aktivite Ekle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Aktivite Adı</Label>
              <Input
                id="name"
                name="name"
                value={newActivity.name}
                onChange={handleActivityChange}
                placeholder="Örn: Tekne Turu"
              />
            </div>
            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                name="description"
                value={newActivity.description}
                onChange={handleActivityChange}
                placeholder="Aktivitenin detaylı açıklaması"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="providerId">Sağlayıcı</Label>
              <Select
                value={newActivity.providerId}
                onValueChange={(value) => handleActivityChange({ target: { name: "providerId", value } })}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Fiyat</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={newActivity.price}
                  onChange={handleActivityChange}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="duration">Süre</Label>
                <Input
                  id="duration"
                  name="duration"
                  value={newActivity.duration}
                  onChange={handleActivityChange}
                  placeholder="Örn: 2 saat"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="capacity">Kapasite</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                value={newActivity.capacity}
                onChange={handleActivityChange}
                placeholder="Maksimum kişi sayısı"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActivityDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveActivity}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aktivite Silme Dialog */}
      <AlertDialog open={isDeleteActivityDialogOpen} onOpenChange={setIsDeleteActivityDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktiviteyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu aktiviteyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteActivity}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

