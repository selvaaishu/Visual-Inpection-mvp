import DroneHeader from "@/components/drone/DroneHeader";
import DroneInspector from "@/components/drone/DroneInspector";

export default function DroneSurveillancePage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <DroneHeader />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <DroneInspector />
      </div>
    </main>
  );
}
