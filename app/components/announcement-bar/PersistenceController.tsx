import { HIDE_ANNOUNCEMENT_BAR_COOKIE } from "@/lib/local-cookies";
import { getCookie } from "cookies-next/server";
import { cookies } from "next/headers";

export async function PersistenceController({ children }: { children: React.ReactNode }) {
  const hideAnnouncementBar = await getCookie(HIDE_ANNOUNCEMENT_BAR_COOKIE, { cookies });
  if(hideAnnouncementBar) return null;

  return children;
}
