import { Card } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-marfim px-4">
      <Card className="max-w-sm">{children}</Card>
    </div>
  );
}
