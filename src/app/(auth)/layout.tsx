import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <Brand />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </main>
  );
}
