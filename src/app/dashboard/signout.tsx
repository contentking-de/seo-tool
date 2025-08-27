"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
	return (
		<button
			onClick={() => signOut({ callbackUrl: "/" })}
			className="underline-offset-4 hover:underline"
		>
			Sign out
		</button>
	);
}
