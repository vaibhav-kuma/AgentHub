import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <SignUp
                path="/sign-up"
                routing="path"
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-2xl",
                    },
                }}
            />
        </div>
    );
}
