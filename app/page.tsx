import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MarketingPage } from "@/components/marketing/marketing-page";

export default async function Home() {
    const user = await currentUser();

    if (user) {
        redirect("/app/dashboard");
    }

    return <MarketingPage />;
}
