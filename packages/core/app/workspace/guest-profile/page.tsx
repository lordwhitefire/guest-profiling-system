import { WorkspaceApp } from "../../../components/workspace/workspace-app";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ guestId?: string | string[] }>;
}) {
  const params = await searchParams;
  const guestId = typeof params.guestId === "string" ? params.guestId : null;
  return <WorkspaceApp initialScreen="guest-profile" initialGuestId={guestId} />;
}