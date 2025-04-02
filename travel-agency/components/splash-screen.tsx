"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"

export function SplashScreen({ onFinish = () => {} }) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("Uygulama başlatılıyor...")

  useEffect(() => {
    const timer = setTimeout(() => {
      // Başlangıç animasyonu
      let currentProgress = 0
      const interval = setInterval(() => {
        currentProgress += 5
        setProgress(currentProgress)

        // Durum mesajlarını güncelle
        if (currentProgress === 20) {
          setStatus("Veriler yükleniyor...")
        } else if (currentProgress === 50) {
          setStatus("Ayarlar kontrol ediliyor...")
        } else if (currentProgress === 80) {
          setStatus("Uygulama hazırlanıyor...")
        }

        if (currentProgress >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            if (typeof onFinish === "function") {
              onFinish()
            }
          }, 500)
        }
      }, 50)

      return () => clearInterval(interval)
    }, 500)

    return () => clearTimeout(timer)
  }, [onFinish])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <Card className="w-[400px] shadow-lg border border-[#00a1c6]/30">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="text-center">
              <img src="/logo.svg" alt="PassionisTravel" className="h-32 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Yönetim Sistemi</p>
            </div>

            <div className="w-full space-y-2">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#00a1c6] transition-all" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">{status}</p>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              © {new Date().getFullYear()} PassionisTravel
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

