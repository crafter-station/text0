import { HIDE_ANNOUNCEMENT_BAR_COOKIE } from "@/lib/local-cookies";
import { getCookie } from "cookies-next/server";
import { cookies } from "next/headers";
import { AnnouncementBar } from "./AnnouncementBar";

export async function AnnouncementBarWrapper() {
	const hideAnnouncementBar = await getCookie(HIDE_ANNOUNCEMENT_BAR_COOKIE, {
		cookies,
	});
	if (hideAnnouncementBar) return null;

	return <AnnouncementBar />;
}
