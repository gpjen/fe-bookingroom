"use client";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { LangSelect } from "@/components/settings/lang-select";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { useLang } from "@/providers/lang-provider";
import { Button } from "../ui/button";
import { signIn } from "next-auth/react";

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

export default function HomeContent({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { t } = useLang();

  return (
    <main className="min-h-screen bg-background">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0F4FF]/10 border border-border rounded-full text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>HARITA LYGEND</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            {t("title")}
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("desc")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className={`h-14 w-full md:w-[250px] px-8 inline-flex items-center justify-center gap-2 text-lg font-semibold rounded-xl transition-all shadow-lg bg-primary text-primary-foreground hover:opacity-90 group`}
              >
                <span>{t("openDashboard")}</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Button
                onClick={() => signIn("keycloak")}
                className={`h-14 w-full md:w-[250px] cursor-pointer px-8 inline-flex items-center justify-center gap-2 text-lg font-semibold rounded-xl transition-all shadow-lg bg-primary text-primary-foreground hover:opacity-90 group`}
              >
                <span>{t("login")}</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}

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
