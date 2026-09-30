"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Authentication failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      // Success: redirect to dashboard
      router.push("/admin/overview");
      router.refresh();
    } catch (err) {
      console.error("Login submission error:", err);
      setError("Unable to connect to authentication service. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#141413] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#F0DFD7] selection:text-[#9E4323]">
      <div className="w-full max-w-sm space-y-6">
        {/* Top Wordmark */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-medium tracking-tight text-[#141413]">
            iRASStudio<span className="text-sm align-super font-normal text-[#6E6E69]">®</span>
          </h1>
          <p className="text-xs uppercase tracking-wider text-[#6E6E69]">
            Admin Console
          </p>
        </div>

        {/* Minimal Login Card */}
        <div className="bg-white border border-[#E8E8E3] rounded-lg p-6 sm:p-7 space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-[#141413]">Sign in</h2>
            <p className="text-xs text-[#71716D] leading-relaxed">
              Enter your admin credentials to access curatorial & community operations.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FDF2F2] border border-[#F2C6C6] text-[#9E3333] text-xs leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B83838]" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              leftIcon={<User className="w-3.5 h-3.5" />}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              leftIcon={<Lock className="w-3.5 h-3.5" />}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
              >
                {isLoading ? "Signing in..." : "Enter Studio"}
              </Button>
            </div>
          </form>
        </div>

        <div className="text-center text-xs text-[#8A8A85]">
          <span>Protected curatorial platform • </span>
          <span className="text-[#6E6E69]">iRAS Studio</span>
        </div>
      </div>
    </div>
  );
}
