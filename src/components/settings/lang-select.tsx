"use client";
import { Lang, useLang } from "@/providers/lang-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";

export function LangSelect() {
  const { lang, setLang } = useLang();

  const langList = [
    // {
    //   value: "en",
    //   label: "English",
    //   flag: (
    //     <svg
    //       className="h-4 w-6 rounded-sm"
    //       viewBox="0 0 60 30"
    //       xmlns="http://www.w3.org/2000/svg"
    //     >
    //       <clipPath id="s">
    //         <path d="M0,0 v30 h60 v-30 z" />
    //       </clipPath>
    //       <clipPath id="t">
    //         <path d="M30,15 h30 v15 z v-15 h-30 z h-30 v15 z v-15 h30 z" />
    //       </clipPath>
    //       <g clipPath="url(#s)">
    //         <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
    //         <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
    //         <path
    //           d="M0,0 L60,30 M60,0 L0,30"
    //           clipPath="url(#t)"
    //           stroke="#C8102E"
    //           strokeWidth="4"
    //         />
    //         <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
    //         <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    //       </g>
    //     </svg>
    //   ),
    // },
    {
      value: "id",
      label: "Indonesia",
      flag: (
        <svg
          className="h-4 w-6 rounded-sm"
          viewBox="0 0 60 30"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="60" height="30" fill="#fff" />
          <rect width="60" height="15" fill="#FF0000" />
          <rect y="15" width="60" height="15" fill="#fff" />
        </svg>
      ),
    },
    {
      value: "zh",
      label: "中文",
      flag: (
        <svg
          className="h-4 w-6 rounded-sm"
          viewBox="0 0 60 30"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="60" height="30" fill="#DE2910" />
          <g fill="#FFDE00">
            <path d="M9,6 L10.5,10.5 L15,10.5 L11.25,13.5 L12.75,18 L9,15 L5.25,18 L6.75,13.5 L3,10.5 L7.5,10.5 Z" />
            <path d="M18,3 L18.5,4.5 L20,4.5 L18.75,5.5 L19.25,7 L18,6 L16.75,7 L17.25,5.5 L16,4.5 L17.5,4.5 Z" />
            <path d="M21,7 L21.5,8.5 L23,8.5 L21.75,9.5 L22.25,11 L21,10 L19.75,11 L20.25,9.5 L19,8.5 L20.5,8.5 Z" />
            <path d="M21,13 L21.5,14.5 L23,14.5 L21.75,15.5 L22.25,17 L21,16 L19.75,17 L20.25,15.5 L19,14.5 L20.5,14.5 Z" />
            <path d="M18,17 L18.5,18.5 L20,18.5 L18.75,19.5 L19.25,21 L18,20 L16.75,21 L17.25,19.5 L16,18.5 L17.5,18.5 Z" />
          </g>
        </svg>
      ),
    },
  ];

  const currentLang = langList.find((item) => item.value === lang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
          <div className="flex h-5 w-7 items-center justify-center rounded-sm border border-border/50 bg-background shadow-sm">
            {currentLang?.flag}
          </div>
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Select Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {langList.map(({ value, label, flag }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setLang(value as Lang)}
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-5 w-7 items-center justify-center rounded-sm border border-border/50 bg-muted/50">
                {flag}
              </div>
              <span>{label}</span>
            </div>
            {lang === value && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
