export default function Header() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Visual Inspection MVP
          </h1>
          <p className="text-sm text-slate-500">
            AI-powered concrete surface inspection
          </p>
        </div>
      </div>
    </header>
  );
}