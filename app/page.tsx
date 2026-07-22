import Header from "@/components/ui/Header";
import InspectionClient from "@/components/ui/InspectionClient";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <InspectionClient />
      </div>
    </main>
  );
}
