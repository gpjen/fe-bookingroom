import { Card } from "@/components/ui/card";
import { Building } from "lucide-react";

export default function Page() {
  return (
    <>
      <Card className="p-3 md:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground/90 dark:text-zinc-50">
            <Building className="size-6" />
            <div className="text-2xl font-bold">Buildings</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Manage your buildings</p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Aspernatur,
          reiciendis perspiciatis?
        </p>
      </Card>
    </>
  );
}
