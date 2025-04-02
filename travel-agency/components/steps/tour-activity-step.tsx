import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

export function TourActivityStep({ formData, updateFormData }) {
  const addActivity = () => {
    const newActivity = {
      id: uuidv4(),
      name: "",
      date: new Date().toISOString().split("T")[0],
      duration: "",
      price: "",
      currency: "TRY",
    }
    updateFormData({
      activities: [...formData.activities, newActivity],
    })
  }

  const updateActivity = (id, field, value) => {
    updateFormData({
      activities: formData.activities.map((activity) =>
        activity.id === id ? { ...activity, [field]: value } : activity
      ),
    })
  }

  const removeActivity = (id) => {
    updateFormData({
      activities: formData.activities.filter((activity) => activity.id !== id),
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Tur Aktiviteleri</h2>
      <p className="text-sm text-muted-foreground">
        Tura dahil olan aktiviteleri ekleyin. Bu aktiviteler tur ücretine ek olarak ayrıca ücretlendirilir.
      </p>

      {formData.activities.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">Eklenmiş Aktiviteler</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Adı</th>
                <th className="text-left py-2">Tarih</th>
                <th className="text-left py-2">Süre</th>
                <th className="text-right py-2">Kişi Başı Fiyat</th>
                <th className="text-right py-2">Toplam ({formData.numberOfPeople} kişi)</th>
                <th className="text-right py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {formData.activities.map((activity) => (
                <tr key={activity.id} className="border-b">
                  <td className="py-2">{activity.name}</td>
                  <td className="py-2">{activity.date}</td>
                  <td className="py-2">{activity.duration}</td>
                  <td className="py-2 text-right">
                    {Number(activity.price || 0).toLocaleString("tr-TR")} {activity.currency}
                  </td>
                  <td className="py-2 text-right">
                    {(Number(activity.price || 0) * Number(formData.numberOfPeople || 1)).toLocaleString("tr-TR")} {activity.currency}
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeActivity(activity.id)}
                      className="h-8 px-2 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan={4} className="py-2 text-right">
                  Toplam Aktivite Tutarı:
                </td>
                <td className="py-2 text-right" colSpan={2}>
                  {formData.activities
                    .reduce((total, activity) => {
                      return total + (Number(activity.price || 0) * Number(formData.numberOfPeople || 1))
                    }, 0)
                    .toLocaleString("tr-TR")}{" "}
                  {formData.currency}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border p-4">
        <h3 className="text-lg font-medium mb-4">Yeni Aktivite Ekle</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="activity-name">Aktivite Adı</Label>
            <Input
              id="activity-name"
              value={formData.activities.length > 0 ? formData.activities[formData.activities.length - 1].name : ""}
              onChange={(e) =>
                updateActivity(
                  formData.activities[formData.activities.length - 1]?.id,
                  "name",
                  e.target.value
                )
              }
              placeholder="Tekne turu"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-date">Tarih</Label>
            <Input
              id="activity-date"
              type="date"
              value={
                formData.activities.length > 0
                  ? formData.activities[formData.activities.length - 1].date
                  : new Date().toISOString().split("T")[0]
              }
              onChange={(e) =>
                updateActivity(
                  formData.activities[formData.activities.length - 1]?.id,
                  "date",
                  e.target.value
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-duration">Süre</Label>
            <Input
              id="activity-duration"
              value={formData.activities.length > 0 ? formData.activities[formData.activities.length - 1].duration : ""}
              onChange={(e) =>
                updateActivity(
                  formData.activities[formData.activities.length - 1]?.id,
                  "duration",
                  e.target.value
                )
              }
              placeholder="2 saat"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-price">Kişi Başı Fiyat</Label>
            <Input
              id="activity-price"
              type="number"
              value={formData.activities.length > 0 ? formData.activities[formData.activities.length - 1].price : ""}
              onChange={(e) =>
                updateActivity(
                  formData.activities[formData.activities.length - 1]?.id,
                  "price",
                  e.target.value
                )
              }
              placeholder="500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity-currency">Para Birimi</Label>
            <Select
              value={
                formData.activities.length > 0
                  ? formData.activities[formData.activities.length - 1].currency
                  : "TRY"
              }
              onValueChange={(value) =>
                updateActivity(
                  formData.activities[formData.activities.length - 1]?.id,
                  "currency",
                  value
                )
              }
            >
              <SelectTrigger id="activity-currency">
                <SelectValue placeholder="Para birimi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">TRY</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex items-end">
            <Button type="button" onClick={addActivity} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="mr-2 h-4 w-4" />
              Aktivite Ekle
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 