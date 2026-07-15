import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
export default function LoginPage() { return <section className="w-full max-w-sm"><p className="text-sm font-semibold text-primary">Signal Log</p><h1 className="mt-2 text-3xl font-semibold">Welcome back</h1><p className="mb-8 mt-2 text-sm text-muted-foreground">Review the patterns behind recurring misses.</p><AuthForm mode="login" /><p className="mt-6 text-sm text-muted-foreground">New here? <Link className="font-medium text-primary hover:underline" href="/signup">Create an account</Link></p></section>; }
