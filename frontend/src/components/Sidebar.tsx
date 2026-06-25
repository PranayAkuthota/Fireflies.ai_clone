"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Sparkles, 
  Video, 
  Activity, 
  Upload, 
  Layers, 
  BarChart2, 
  Bot, 
  Sparkle, 
  Users, 
  Star, 
  Settings, 
  MoreHorizontal
} from "lucide-react";
import { FirefliesLogo, FredLogo } from "./icons";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const menuSections = [
    {
      items: [
        { name: "Home", href: "/", icon: Home, active: false },
        { name: "AskFred", href: "#", icon: Sparkles, active: false, disabled: true },
        { name: "Meetings", href: "/", icon: Video, active: pathname === "/" || pathname.startsWith("/meetings") },
        { name: "Meeting Status", href: "#", icon: Activity, active: false, disabled: true },
        { name: "Uploads", href: "#", icon: Upload, active: false, disabled: true },
      ]
    },
    {
      items: [
        { name: "Integrations", href: "#", icon: Layers, active: false, disabled: true },
        { name: "Analytics", href: "#", icon: BarChart2, active: false, disabled: true },
      ]
    },
    {
      items: [
        { name: "Voice Agents", href: "#", icon: Bot, active: false, disabled: true },
        { name: "AI Skills", href: "#", icon: Sparkle, active: false, disabled: true },
      ]
    },
    {
      items: [
        { name: "Team", href: "#", icon: Users, active: false, disabled: true },
        { name: "Upgrade", href: "#", icon: Star, active: false, disabled: true },
        { name: "Settings", href: "#", icon: Settings, active: false, disabled: true },
        { name: "More", href: "#", icon: MoreHorizontal, active: false, disabled: true },
      ]
    }
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-16 flex-col items-center border-r border-slate-200 bg-white text-slate-600 py-3">
      
      {/* Brand Header: Official Logo */}
      <div className="flex h-9 w-9 items-center justify-center mb-5">
        <FirefliesLogo className="h-6 w-6" />
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 w-full overflow-y-auto px-2 space-y-3.5 flex flex-col items-center">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="w-full flex flex-col items-center gap-2">
            {section.items.map((item, idx) => {
              const Icon = item.icon;
              const isActive = item.active;

              if (item.name === "AskFred") {
                return (
                  <div
                    key={idx}
                    title={item.name}
                    className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <FredLogo className="h-6 w-6" />
                  </div>
                );
              }

              if (item.disabled) {
                return (
                  <div
                    key={idx}
                    title={item.name}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 cursor-not-allowed transition-colors"
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                );
              }

              return (
                <Link
                  key={idx}
                  href={item.href}
                  title={item.name}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                    isActive
                      ? "bg-[#f3f0fc] text-[#7047eb]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </Link>
              );
            })}
            
            {/* Small divider line between sections */}
            {sIdx < menuSections.length - 1 && (
              <div className="w-6 border-t border-slate-100 my-1" />
            )}
          </div>
        ))}
      </div>

      {/* Sidebar Footer: Profile badge only */}
      <div className="mt-auto flex flex-col items-center gap-3">
        <div 
          title="Pranaykumar (pranay@scaler.ai)"
          className="relative h-8 w-8 rounded-full bg-indigo-100 border border-slate-200 flex items-center justify-center text-indigo-700 font-bold text-xs cursor-pointer select-none"
        >
          PK
          <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"></div>
        </div>
      </div>

    </aside>
  );
};

