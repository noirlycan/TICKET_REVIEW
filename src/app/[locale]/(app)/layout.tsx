import { auth } from "@/auth";
import { AppHeader } from "@/components/AppHeader";
import { Providers } from "@/components/Providers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <Providers session={session}>
      <AppHeader username={session?.user?.name} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </Providers>
  );
}
