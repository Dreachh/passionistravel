"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Menu, Home, Calendar, DollarSign, BarChart2, Settings, Database, RefreshCw, Globe, LayoutDashboard, FileText, User } from "lucide-react"

export function MainHeader({ onNavigate, currentView }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Ana menü öğeleri
  const mainMenuItems = [
    { id: "dashboard", label: "Ana Sayfa", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "calendar", label: "Takvim", icon: <Calendar className="h-5 w-5" /> }
  ]

  // İşlemler menü öğeleri
  const operationsMenuItems = [
    { id: "financial-entry", label: "Finansal Giriş", icon: <DollarSign className="h-5 w-5" /> },
    { id: "tour-sales", label: "Tur Satışı", icon: <Globe className="h-5 w-5" /> }
  ]

  // Yönetim menü öğeleri
  const managementMenuItems = [
    { id: "data-view", label: "Veri Görüntüleme", icon: <Database className="h-5 w-5" /> },
    { id: "analytics", label: "Analitik", icon: <BarChart2 className="h-5 w-5" /> },
    { id: "currency", label: "Döviz Kurları", icon: <RefreshCw className="h-5 w-5" /> },
    { id: "settings", label: "Ayarlar", icon: <Settings className="h-5 w-5" /> }
  ]

  // Mobil menü için tüm öğeleri birleştir
  const allMenuItems = [
    ...mainMenuItems,
    { id: "separator-1", isSeparator: true },
    ...operationsMenuItems,
    { id: "separator-2", isSeparator: true },
    ...managementMenuItems
  ]

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-[#2b3275] hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate("dashboard")}>
              <img src="/logo.svg" alt="PassionisTravel Logo" className="h-14" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center">
            <div className="flex space-x-1 mr-2">
              {mainMenuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onNavigate(item.id)}
                  className={`${
                    currentView === item.id 
                      ? "bg-[#00a1c6] text-white" 
                      : "text-[#2b3275] hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </div>
                </Button>
              ))}
            </div>

            <div className="flex space-x-1 mr-2">
              {operationsMenuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onNavigate(item.id)}
                  className={`${
                    currentView === item.id 
                      ? "bg-[#00a1c6] text-white" 
                      : "text-[#2b3275] hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </div>
                </Button>
              ))}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-[#2b3275] hover:bg-gray-100">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5" />
                    <span className="ml-2">Diğer</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {managementMenuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    className={currentView === item.id ? "bg-[#00a1c6]/20 text-[#2b3275]" : ""}
                    onClick={() => onNavigate(item.id)}
                  >
                    <div className="flex items-center">
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Mobile Navigation Dropdown */}
          <div className="md:hidden">
            <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[#2b3275] hover:bg-gray-100">
                  <Menu className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {allMenuItems.map((item) => 
                  item.isSeparator ? (
                    <DropdownMenuSeparator key={item.id} />
                  ) : (
                    <DropdownMenuItem
                      key={item.id}
                      className={currentView === item.id ? "bg-[#00a1c6]/20 text-[#2b3275]" : ""}
                      onClick={() => {
                        onNavigate(item.id)
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                      </div>
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

