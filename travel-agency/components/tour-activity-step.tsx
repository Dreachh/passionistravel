import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Tip tanımları
interface Activity {
  id: string;
  name: string;
  date: string;
  duration: string;
  price: string;
  currency: string;
  provider: string;
  details: string;
}

interface TourActivityStepProps {
  activities: Activity[];
  numberOfPeople: number;
  addActivity: () => void;
  removeActivity: (id: string) => void;
  updateActivity: (id: string, field: string, value: string) => void;
  providers: any[];
  currencyOptions: { value: string; label: string }[];
  onNext: () => void;
  onPrev: () => void;
}

export function TourActivityStep({
  activities,
  numberOfPeople,
  addActivity,
  removeActivity,
  updateActivity,
  providers,
  currencyOptions,
  onNext,
  onPrev,
}: TourActivityStepProps) {
  // Toplam aktivite fiyatlarını hesapla
  const calculateTotalActivityPrice = (activity: Activity): number => {
    const price = parseFloat(activity.price) || 0;
    return price * numberOfPeople;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Tur Aktiviteleri</h3>
        <Button type="button" variant="outline" size="sm" onClick={addActivity}>
          <Plus className="h-4 w-4 mr-2" />
          Aktivite Ekle
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground border rounded-md">
          Henüz aktivite eklenmemiş
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aktivite</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Süre</TableHead>
                <TableHead className="text-right">Kişi Başı Fiyat</TableHead>
                <TableHead className="text-right">Kişi Sayısı</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{activity.name || "İsimsiz aktivite"}</TableCell>
                  <TableCell>
                    {activity.date
                      ? new Date(activity.date).toLocaleDateString("tr-TR")
                      : "-"}
                  </TableCell>
                  <TableCell>{activity.duration || "-"}</TableCell>
                  <TableCell className="text-right">
                    {activity.price ? `${activity.price} ${activity.currency}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {numberOfPeople}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {calculateTotalActivityPrice(activity).toLocaleString('tr-TR')} {activity.currency}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeActivity(activity.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                      <span className="sr-only">Sil</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {activities.map((activity) => (
            <Card key={activity.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 p-4">
                <CardTitle className="text-base flex justify-between">
                  <span>
                    {activity.name || "Yeni Aktivite"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeActivity(activity.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Aktivite Adı</Label>
                    <Input
                      value={activity.name}
                      onChange={(e) =>
                        updateActivity(activity.id, "name", e.target.value)
                      }
                      placeholder="Aktivite adı"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tarih</Label>
                    <Input
                      type="date"
                      value={activity.date}
                      onChange={(e) =>
                        updateActivity(activity.id, "date", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Süre</Label>
                    <Input
                      value={activity.duration}
                      onChange={(e) =>
                        updateActivity(activity.id, "duration", e.target.value)
                      }
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
                        onChange={(e) =>
                          updateActivity(activity.id, "price", e.target.value)
                        }
                        placeholder="0.00"
                      />
                      <Select
                        value={activity.currency}
                        onValueChange={(value) =>
                          updateActivity(activity.id, "currency", value)
                        }
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
                    <p className="text-xs text-muted-foreground">
                      Toplam: {calculateTotalActivityPrice(activity).toLocaleString('tr-TR')} {activity.currency}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Sağlayıcı</Label>
                    <Select
                      value={activity.provider}
                      onValueChange={(value) =>
                        updateActivity(activity.id, "provider", value)
                      }
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
                      onChange={(e) =>
                        updateActivity(activity.id, "details", e.target.value)
                      }
                      placeholder="Ek bilgiler"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={onPrev}>
          Geri
        </Button>
        <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={onNext}>
          İleri
        </Button>
      </div>
    </div>
  );
} 