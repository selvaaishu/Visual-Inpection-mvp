import Header from "@/components/ui/Header";
import UploadCard from "@/components/ui/UploadCard";
import ImagePreview from "@/components/ui/ImagePreview";
import InspectionResults from "@/components/ui/InspectionResults";
import EngineeringReport from "@/components/ui/EngineeringReport";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="grid gap-8 lg:grid-cols-2">

          {/* Left Column */}
          <div>
            <UploadCard />
            <ImagePreview />
          </div>

          {/* Right Column */}
          <div>
            <InspectionResults />
          </div>

        </div>

        <EngineeringReport />

      </div>
    </main>
  );
}