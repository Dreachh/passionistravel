"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { v4 as uuidv4 } from "uuid"

export function FinancialEntryForm({ initialData = null, onSave, onCancel }) {
  const [formChanged, setFormChanged] = useState(false);
  const [formData, setFormData] = useState({
    id: initialData?.id || uuidv4(),
    date: initialData?.date || new Date().toISOString().split("T")[0],
    type: initialData?.type || "income",
    category: initialData?.category || "",
    amount: initialData?.amount || "",
    description: initialData?.description || "",
    paymentMethod: initialData?.paymentMethod || "cash",
  })

  // Form verilerini localStorage'e kaydet
  useEffect(() => {
    if (formChanged) {
      localStorage.setItem('financialEntryFormData', JSON.stringify(formData));
    }
  }, [formData, formChanged]);

  // İlk yüklemede localStorage'den form verilerini al (eğer initialData yoksa)
  useEffect(() => {
    if (!initialData) {
      const savedForm = localStorage.getItem('financialEntryFormData');
      if (savedForm) {
        try {
          const parsedForm = JSON.parse(savedForm);
          setFormData(parsedForm);
        } catch (error) {
          console.error("Form verisi yüklenirken hata:", error);
        }
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormChanged(true);
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormChanged(true);
  }

  // onSubmit fonksiyonunu düzeltelim
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      amount: Number.parseFloat(formData.amount),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    
    // Formu gönderdikten sonra localStorage'den temizle
    localStorage.removeItem('financialEntryFormData');
    setFormChanged(false);
    
    // Formu sıfırla (yeni finansal kayıt için)
    setFormData({
      id: uuidv4(),
      date: new Date().toISOString().split("T")[0],
      type: "income",
      category: "",
      amount: "",
      description: "",
      paymentMethod: "cash",
    });
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Finansal Kaydı Düzenle" : "Yeni Finansal Kayıt"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Tarih</Label>
              <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">İşlem Tipi</Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="İşlem tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Kategori girin"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Tutar (₺)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Açıklama girin"
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            İptal
          </Button>
          <Button type="submit" className="bg-[#2b3275] hover:bg-[#00a1c6]">
            {initialData ? "Güncelle" : "Kaydet"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

