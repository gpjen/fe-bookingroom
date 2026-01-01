"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldX,
  MessageSquare,
  ExternalLink,
  LogOut,
  Sparkles,
  ArrowRight,
  Home,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useLang } from "@/providers/lang-provider";
import { type SystemSettingsInput } from "@/app/(protected)/admin/settings/_actions/settings.schema";

interface NoAccessViewProps {
  settings?: SystemSettingsInput;
}

export function NoAccessView({ settings }: NoAccessViewProps) {
  const { t, lang } = useLang();

  const handleLogout = () => {
    signOut({ callbackUrl: `/api/auth/logout?lang=${lang}` });
  };

  const whatsappLink =
    settings?.general?.supportWhatsapp ||
    "https://wa.me/6281143403568?text=Halo%2C%20saya%20butuh%20bantuan%20untuk%20akses%20sistem";

  const helpdeskLink =
    settings?.general?.supportHelpdesk || "http://helpdesk.obi.com/";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-xl">
        <div className="backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 rounded-3xl p-8 md:p-10 shadow-2xl transition-all duration-300 hover:shadow-red-900/20">
          {/* Icon with Glow */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-red-500/30 blur-2xl rounded-full animate-pulse group-hover:bg-red-500/50 transition-all duration-500" />
              <div className="relative p-6 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl backdrop-blur-sm border border-red-500/30 group-hover:scale-110 transition-transform duration-300">
                <ShieldX
                  className="h-16 w-16 text-red-400 drop-shadow-lg"
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <Badge className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-sm shadow-sm">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              {t("accessDenied")}
            </Badge>
          </div>

          {/* Title & Description */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-sm">
              {t("noAccessTitle")}
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              {t("noAccessDesc")}
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <InfoCard icon="⚠️" label={t("status")} value={t("noAccess")} />
            <InfoCard icon="🔐" label={t("permission")} value={t("required")} />
            <InfoCard icon="👤" label={t("account")} value={t("inactive")} />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                size="lg"
                className="w-full gap-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg shadow-green-500/20 group hover:translate-y-[-2px] transition-all duration-200"
              >
                <MessageSquare className="h-5 w-5 fill-white/20" />
                <span className="flex-1 text-left font-semibold">
                  {t("contactIT")}
                </span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>

            <a
              href={helpdeskLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-3 bg-white/5 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm group hover:translate-y-[-2px] transition-all duration-200"
              >
                <ExternalLink className="h-5 w-5" />
                <span className="flex-1 text-left font-semibold">
                  {t("helpdesk")}
                </span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>

            <Link href="/" className="block">
              <Button
                size="lg"
                variant="secondary"
                className="w-full gap-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 border border-blue-500/30 group hover:translate-y-[-2px] transition-all duration-200"
              >
                <Home className="h-5 w-5" />
                <span className="flex-1 text-left font-semibold">
                  Kembali ke Beranda
                </span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Button
              size="lg"
              variant="ghost"
              onClick={handleLogout}
              className="w-full gap-3 text-slate-400 hover:text-white hover:bg-white/5 group mt-2"
            >
              <LogOut className="h-5 w-5" />
              <span className="flex-1 text-left font-semibold">
                {t("logoutSystem")}
              </span>
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
            <span>{t("secureAccess")}</span>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-slate-500 text-sm mt-6">
          {t("errorMistake")}
        </p>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center hover:bg-white/10 transition-all hover:scale-105 duration-200 cursor-default">
      <div className="text-2xl mb-1 filter drop-shadow-md">{icon}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
        {label}
      </div>
      <div className="text-xs font-semibold text-white">{value}</div>
    </div>
  );
}
