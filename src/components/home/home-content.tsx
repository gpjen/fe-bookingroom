"use client";
import Link from "next/link";
import { Building2, Calendar, Shield, ArrowRight } from "lucide-react";
import { LangSelect } from "@/components/settings/lang-select";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { useLang } from "@/providers/lang-provider";
import { Button } from "../ui/button";
import { signIn } from "next-auth/react";
import Image from "next/image";

function Feature({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="group flex items-center gap-3 p-4 border border-border rounded-xl bg-card hover:bg-accent/50 transition-all">
      <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="font-medium text-card-foreground">{title}</span>
    </div>
  );
}

export default function HomeContent() {
  const { t, lang } = useLang();

  return (
    <main className="relative min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: "url('/bg.webp')" }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-white/60 dark:bg-black/60"
          aria-hidden
        />
      </div>
      {/* Header Actions */}
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <div className="flex items-center justify-end gap-3">
          <LangSelect />
          <ThemeToggle />
        </div>
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-32">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-0 bg-white dark:bg-[#1F2937] border border-border rounded-full text-sm font-medium">
            <Image
              src="/logo_sm.png"
              alt="Logo"
              width={50}
              height={50}
              priority
            />
            <span>HARITA LYGEND</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground dark:text-white">
            {t("title")}
          </h1>

          {/* Subheadline */}
          <p className="text-xl max-w-2xl mx-auto text-gray dark:text-white">
            {t("desc")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              onClick={() =>
                signIn(
                  "keycloak",
                  { callbackUrl: "/dashboard" },
                  { kc_locale: lang === "zh" ? "zh-CN" : lang }
                )
              }
              className={`h-14 w-full md:w-[250px] cursor-pointer px-8 inline-flex items-center justify-center gap-2 text-lg font-semibold rounded-xl transition-all shadow-lg bg-primary text-primary-foreground hover:opacity-90 group`}
            >
              <span>{t("login")}</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Link
              href="/bookings"
              className={`h-14 w-full md:w-[250px] px-8 inline-flex items-center justify-center gap-2 text-lg font-semibold rounded-xl transition-all shadow-lg border-2 border-border text-foreground hover:bg-accent`}
            >
              {t("viewBookings")}
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-3 gap-4 pt-12">
            <Feature
              icon={<Building2 className="h-5 w-5" />}
              title={t("featureBuildings")}
            />
            <Feature
              icon={<Calendar className="h-5 w-5" />}
              title={t("featureCalendar")}
            />
            <Feature
              icon={<Shield className="h-5 w-5" />}
              title={t("featureAuth")}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
