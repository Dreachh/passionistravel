"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function CalendarView({ onNavigate, onViewTour }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  // Örnek tur verileri
  const events = [
    { id: 1, date: new Date(2023, currentMonth, 5), title: "Kapadokya Turu", customers: 4 },
    { id: 2, date: new Date(2023, currentMonth, 12), title: "İstanbul Boğaz Turu", customers: 6 },
    { id: 3, date: new Date(2023, currentMonth, 18), title: "Pamukkale Turu", customers: 3 },
    { id: 4, date: new Date(2023, currentMonth, 25), title: "Efes Antik Kenti Turu", customers: 8 },
  ]

  const monthNames = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ]

  const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Ayın ilk gününü ve toplam gün sayısını hesapla
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  // Takvim günlerini oluştur
  const calendarDays = []

  // Haftanın ilk günü Pazartesi (1) olacak şekilde ayarla
  const firstDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  // Önceki ayın günlerini ekle
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push({ day: null, events: [] })
  }

  // Mevcut ayın günlerini ekle
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    const dayEvents = events.filter(
      (event) =>
        event.date.getDate() === day &&
        event.date.getMonth() === currentMonth &&
        event.date.getFullYear() === currentYear,
    )
    calendarDays.push({ day, date, events: dayEvents })
  }

  // Takvimi 7'nin katı olacak şekilde tamamla
  const remainingDays = 7 - (calendarDays.length % 7)
  if (remainingDays < 7) {
    for (let i = 0; i < remainingDays; i++) {
      calendarDays.push({ day: null, events: [] })
    }
  }

  // Takvimi haftalara böl
  const weeks = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Takvim</CardTitle>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium">
            {monthNames[currentMonth]} {currentYear}
          </div>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Select defaultValue="month">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Görünüm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Aylık</SelectItem>
              <SelectItem value="week">Haftalık</SelectItem>
              <SelectItem value="day">Günlük</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => onNavigate("dashboard")}>
            Kapat
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-7 border-b">
            {dayNames.map((day, index) => (
              <div key={index} className="py-2 text-center font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {weeks.map((week, weekIndex) =>
              week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`min-h-[100px] p-2 border-r border-b ${day.day === null ? "bg-gray-50" : ""} ${
                    day.day === new Date().getDate() &&
                    currentMonth === new Date().getMonth() &&
                    currentYear === new Date().getFullYear()
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  {day.day !== null && (
                    <>
                      <div className="font-medium">{day.day}</div>
                      <div className="mt-1 space-y-1">
                        {day.events.map((event) => (
                          <div
                            key={event.id}
                            className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer"
                            onClick={() => onViewTour(event.id)}
                          >
                            {event.title} ({event.customers})
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )),
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

