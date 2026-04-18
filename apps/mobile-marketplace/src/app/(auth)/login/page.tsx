import { redirect } from "next/navigation";

/** @deprecated Use `/sign-in` — kept for bookmarks and old links. */
export default function LoginPage() {
	redirect("/sign-in");
}
