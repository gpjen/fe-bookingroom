"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useLang } from "@/providers/lang-provider";

export default function NotFound() {
  const { t } = useLang();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">{t("notFoundTitle")}</h2>
        <p className="text-muted-foreground max-w-[42rem] leading-normal sm:text-lg sm:leading-8">
          {t("notFoundDesc")}
        </p>
        <Button asChild className="mt-4" size="lg">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            {t("backToHome")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
