import { Wheat } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wheat className="h-10 w-10 text-green-600" />
          <span className="text-3xl font-bold text-gray-900">
            AZAT
          </span>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
