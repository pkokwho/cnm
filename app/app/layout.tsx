import { NavBar } from "@/components/nav-bar";

export default function WorkspaceLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg2">
      <NavBar />
      <main className="mx-auto max-w-[1100px] px-4 py-6">{children}</main>
    </div>
  );
}
