import { Card } from "@/components/ui/card";

export default function Page() {
  return (
    <>
      <Card className="p-3 md:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">Rooms</div>
        </div>
        <p className="text-sm text-muted-foreground">Manage your rooms</p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Culpa,
          recusandae.
        </p>
      </Card>
    </>
  );
}
