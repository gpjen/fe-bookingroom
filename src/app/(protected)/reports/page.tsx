"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UsersPage() {
  return (
    <Card className="p-3 md:p-6 lg:p-8">
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>Manage your settings</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Lorem ipsum dolor sque earum sed magni! Ut blanditiis quibusdam
          deserunt similique.
        </p>
      </CardContent>
    </Card>
  );
}
