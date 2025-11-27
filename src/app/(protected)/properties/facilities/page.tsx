import { Card } from "@/components/ui/card";

export default function Page() {
  return (
    <>
      <Card className="p-3 md:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">Facilities</div>
        </div>
        <p className="text-sm text-muted-foreground">Manage your facilities</p>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem
          necessitatibus accusamus dolorem ad nemo quidem sint, asperiores rerum
          voluptas neque ipsam mollitia?
        </p>
      </Card>
    </>
  );
}
