import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import HomeContent from "@/components/home/home-content";

export default async function Page() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session);
  return <HomeContent isLoggedIn={isLoggedIn} />;
}
