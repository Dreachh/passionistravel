"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/data-utils"
import { getAllData, getSettings } from "@/lib/db"
import { ArrowUpCircle, ArrowDownCircle, DollarSign, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  Tooltip as UITooltip, 
  TooltipContent, 
  TooltipTrigger, 
  TooltipProvider 
} from "@/components/ui/tooltip"

// Tip tanımlarını ekleyelim
type Tour = {
  id: string;
  tourName: string;
  tourDate: string;
  numberOfPeople: string | number;
  totalPrice: string | number;
  activities: any[];
  [key: string]: any;
}

type Financial = {
  id: string;
  type: string;
  amount: string | number;
  date: string;
  category: string;
  [key: string]: any;
}

interface AnalyticsViewProps {
  financialData?: Financial[];
  toursData?: Tour[];
  onClose: () => void;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
}

export function AnalyticsView({ 
  financialData: propFinancialData = [], 
  toursData: propToursData = [], 
  onClose, 
  onRefresh 
}: AnalyticsViewProps) {
  const [dateRange, setDateRange] = useState("thisMonth")
  const [financialData, setFinancialData] = useState<Financial[]>(propFinancialData as Financial[])
  const [toursData, setToursData] = useState<Tour[]>(propToursData as Tour[])
  const [filteredFinancialData, setFilteredFinancialData] = useState<Financial[]>([])
  const [filteredToursData, setFilteredToursData] = useState<Tour[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [preferences, setPreferences] = useState<any>({ defaultCurrency: "TRY" })

  // Veri yükleme fonksiyonu
  const loadData = async () => {
    console.log("Analiz verileri yükleniyor...")
    setIsLoading(true)
    try {
      // Veritabanından verileri yükle
      const rawTours = await getAllData("tours");
      const rawFinancials = await getAllData("financials");
      
      const tours = Array.isArray(rawTours) ? rawTours as Tour[] : [];
      const financials = Array.isArray(rawFinancials) ? rawFinancials as Financial[] : [];
      
      console.log(`Analiz verileri yüklendi: ${tours.length} tur, ${financials.length} finansal kayıt`);
      
      setToursData(tours)
      setFinancialData(financials)
      
      // Kullanıcı tercihlerini yükle
      const settings = await getSettings();
      if (settings?.preferences) {
        setPreferences(settings.preferences);
      }
    } catch (error) {
      console.error("Analiz veri yükleme hatası:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // İlk yüklendiğinde veri yükleme
  useEffect(() => {
    loadData()
  }, [])

  // Prop'lar değiştiğinde durumu güncelle
  useEffect(() => {
    if (propFinancialData?.length > 0) {
      setFinancialData(propFinancialData as Financial[]);
    }
    if (propToursData?.length > 0) {
      setToursData(propToursData as Tour[]);
    }
  }, [propFinancialData, propToursData]);

  // Tarih aralığına göre verileri filtrele
  useEffect(() => {
    const now = new Date()
    let startDate = new Date()

    // Tarih aralığını belirle
    if (dateRange === "thisWeek") {
      // Bu haftanın başlangıcı (Pazartesi)
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      startDate = new Date(now.setDate(diff))
      startDate.setHours(0, 0, 0, 0)
    } else if (dateRange === "thisMonth") {
      // Bu ayın başlangıcı
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (dateRange === "lastMonth") {
      // Geçen ayın başlangıcı
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      now.setDate(0) // Geçen ayın son günü
    } else if (dateRange === "thisYear") {
      // Bu yılın başlangıcı
      startDate = new Date(now.getFullYear(), 0, 1)
    } else if (dateRange === "allTime") {
      // Tüm zamanlar
      startDate = new Date(0) // 1970-01-01
    }

    // Finansal verileri filtrele
    const filteredFinancial = financialData.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= startDate && itemDate <= now
    })

    // Tur verilerini filtrele
    const filteredTours = toursData.filter((item) => {
      const itemDate = new Date(item.tourDate)
      return itemDate >= startDate && itemDate <= now
    })

    setFilteredFinancialData(filteredFinancial)
    setFilteredToursData(filteredTours)
  }, [dateRange, financialData, toursData])

  // Analitik hesaplamaları
  const totalIncome = useMemo(() => 
    financialData
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + (Number.parseFloat(String(item.amount)) || 0), 0)
  , [financialData]);

  const totalExpense = useMemo(() => 
    financialData
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + (Number.parseFloat(String(item.amount)) || 0), 0)
  , [financialData]);

  const totalProfit = totalIncome - totalExpense

  const totalTours = filteredToursData.length

  const totalCustomers = useMemo(() => 
    toursData.reduce((sum, tour) => sum + (Number.parseInt(String(tour.numberOfPeople)) || 0), 0)
  , [toursData]);

  const averageTourPrice = useMemo(() => 
    toursData.length > 0 
      ? toursData.reduce((sum, tour) => sum + (Number.parseFloat(String(tour.totalPrice)) || 0), 0) / toursData.length 
      : 0
  , [toursData]);

  // Gelir kategorileri
  const incomeByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    financialData
      .filter(item => item.type === 'income')
      .forEach(item => {
        const category = item.category || 'Diğer';
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category] += Number.parseFloat(String(item.amount)) || 0;
      });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [financialData]);

  const expenseByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    financialData
      .filter(item => item.type === 'expense')
      .forEach(item => {
        const category = item.category || 'Diğer';
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category] += Number.parseFloat(String(item.amount)) || 0;
      });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [financialData]);

  // Aylık gelir/gider trendi
  const getMonthlyData = useCallback(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        name: date.toLocaleDateString('tr-TR', { month: 'short' }),
        month: date.getMonth(),
        year: date.getFullYear()
      };
    }).reverse();

    const monthlyData = last6Months.map(({ name, month, year }) => {
      const income = financialData
        .filter(item => {
          const date = new Date(item.date);
          return item.type === 'income' && date.getMonth() === month && date.getFullYear() === year;
        })
        .reduce((sum, item) => sum + (Number.parseFloat(String(item.amount)) || 0), 0);

      const expense = financialData
        .filter(item => {
          const date = new Date(item.date);
          return item.type === 'expense' && date.getMonth() === month && date.getFullYear() === year;
        })
        .reduce((sum, item) => sum + (Number.parseFloat(String(item.amount)) || 0), 0);

      return { name, income, expense };
    });

    return monthlyData;
  }, [financialData]);

  const monthlyData = getMonthlyData()

  // Tur popülerliği
  const tourPopularity = useMemo(() => {
    const tourStats: Record<string, { count: number, revenue: number, customers: number }> = {};
    
    toursData.forEach(tour => {
      const destinationName = tour.tourName || 'Bilinmiyor';
      
      if (!tourStats[destinationName]) {
        tourStats[destinationName] = { count: 0, revenue: 0, customers: 0 };
      }
      
      tourStats[destinationName].count += 1;
      tourStats[destinationName].revenue += Number.parseFloat(String(tour.totalPrice)) || 0;
      tourStats[destinationName].customers += Number.parseInt(String(tour.numberOfPeople)) || 0;
    });
    
    return Object.entries(tourStats)
      .map(([name, { count, revenue, customers }]) => ({
        name,
        count,
        revenue,
        customers,
        averagePrice: count > 0 ? revenue / count : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [toursData]);

  // Grafik renkleri
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d", "#ffc658", "#8dd1e1"]

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[#2b3275]">Analiz ve Raporlar</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tarih aralığı seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">Bu Hafta</SelectItem>
              <SelectItem value="thisMonth">Bu Ay</SelectItem>
              <SelectItem value="lastMonth">Geçen Ay</SelectItem>
              <SelectItem value="thisYear">Bu Yıl</SelectItem>
              <SelectItem value="allTime">Tüm Zamanlar</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadData} disabled={isLoading}>
            {isLoading ? "Yükleniyor..." : "Yenile"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#00a1c6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Veriler yükleniyor...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="financial">
            <TabsList className="mb-4">
              <TabsTrigger value="financial">Finansal Analiz</TabsTrigger>
              <TabsTrigger value="tours">Tur Analizi</TabsTrigger>
            </TabsList>

            <TabsContent value="financial">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                    <ArrowUpCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalIncome, preferences.defaultCurrency, preferences)}</div>
                    <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
                    <ArrowDownCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalExpense, preferences.defaultCurrency, preferences)}</div>
                    <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Kar</CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalIncome - totalExpense, preferences.defaultCurrency, preferences)}</div>
                    <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Aylık Gelir/Gider Trendi</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip
                          formatter={(value: any, name: any) => {
                            if (name === "income" || name === "revenue" || name === "expense" || name === "profit") {
                              const currency = "TRY"; // Varsayılan değer
                              return [formatCurrency(value, currency, preferences), 
                                name === "income" ? "Gelir" : 
                                name === "expense" ? "Gider" : 
                                name === "profit" ? "Kar" : 
                                name === "revenue" ? "Ciro" : name];
                            }
                            return [value, name];
                          }} 
                        />
                        <Legend />
                        <Line type="monotone" dataKey="income" name="Gelir" stroke="#4ade80" strokeWidth={2} />
                        <Line type="monotone" dataKey="expense" name="Gider" stroke="#f87171" strokeWidth={2} />
                        <Line type="monotone" dataKey="profit" name="Kar" stroke="#60a5fa" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Gelir Dağılımı</h3>
                    <div className="h-[300px]">
                      {incomeByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={incomeByCategory}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {incomeByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value: any, name: any) => {
                                if (name === "value") {
                                  return [formatCurrency(value, preferences.defaultCurrency, preferences), 'Tutar'];
                                }
                                return [value, name];
                              }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center border rounded-md bg-gray-50">
                          <p className="text-muted-foreground">Yeterli veri yok</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Gider Dağılımı</h3>
                    <div className="h-[300px]">
                      {expenseByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expenseByCategory}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {expenseByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value: any, name: any) => {
                                if (name === "value") {
                                  return [formatCurrency(value, preferences.defaultCurrency, preferences), 'Tutar'];
                                }
                                return [value, name];
                              }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center border rounded-md bg-gray-50">
                          <p className="text-muted-foreground">Yeterli veri yok</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tours">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Tur Sayısı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalTours}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Müşteri Sayısı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalCustomers}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Ortalama Tur Fiyatı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(averageTourPrice, preferences.defaultCurrency, preferences)}
                    </div>
                    <p className="text-xs text-muted-foreground">Tüm turlar</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Tur Popülerliği</h3>
                  <div className="h-[400px]">
                    {tourPopularity.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tourPopularity} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                          <RechartsTooltip
                            formatter={(value: any, name: any) => {
                              if (name === "revenue") return [formatCurrency(value, preferences.defaultCurrency, preferences), 'Gelir'];
                              return [value, name];
                            }}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="count" name="Tur Sayısı" fill="#8884d8" />
                          <Bar yAxisId="left" dataKey="customers" name="Müşteri Sayısı" fill="#82ca9d" />
                          <Bar yAxisId="right" dataKey="revenue" name="Gelir" fill="#ffc658" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center border rounded-md bg-gray-50">
                        <p className="text-muted-foreground">Yeterli veri yok</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Aylık Tur Trendi</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="tours" name="Tur Sayısı" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="pt-4">
                  <TooltipProvider>
                    {tourPopularity.map((tour, index) => (
                      <div key={index} className="flex items-center space-x-2 py-2 border-b last:border-0">
                        <span className="flex-1 font-medium">{tour.name}</span>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{tour.customers}</span>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Toplam {tour.customers} müşteri</p>
                            <p>Toplam gelir: {formatCurrency(tour.revenue, preferences.defaultCurrency, preferences)}</p>
                          </TooltipContent>
                        </UITooltip>
                        <span className="text-sm text-muted-foreground">{tour.count} tur</span>
                      </div>
                    ))}
                  </TooltipProvider>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

