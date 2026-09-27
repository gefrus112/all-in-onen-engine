"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStudio } from "@/lib/studio-store";
import { Github, LogOut, User, Check } from "lucide-react";

export function GitHubAuth() {
  const { authOpen, setAuthOpen, user, setUser, addConsole } = useStudio();

  const handleSignIn = () => {
    // In a real deployment, this would redirect to GitHub OAuth:
    // window.location.href = "/api/auth/signin/github";
    // For this sandbox, we simulate the OAuth flow.
    const fakeUser = {
      name: "gefrus112",
      avatar: "https://github.com/gefrus112.png",
      githubLogin: "gefrus112",
    };
    setUser(fakeUser);
    addConsole("success", `Signed in as @${fakeUser.githubLogin}`);
    setAuthOpen(false);
  };

  const handleSignOut = () => {
    setUser(null);
    addConsole("system", "Signed out");
    setAuthOpen(false);
  };

  return (
    <Dialog open={authOpen} onOpenChange={setAuthOpen}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            GitHub Sign-in
          </DialogTitle>
          <DialogDescription>
            Sign in with GitHub to sync projects to your repositories and unlock cloud features.
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 rounded-md bg-primary/5 border border-primary/20">
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">@{user.githubLogin}</div>
              </div>
              <Check className="w-4 h-4 text-green-500" />
            </div>
            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-1" />
                Sign out
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground mb-3">By signing in, you can:</div>
              {[
                "Sync projects to your GitHub repositories",
                "Push to your repos with one click",
                "Share projects with collaborators",
                "Access cloud-saved asset libraries",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-xs">
                  <Check className="w-3 h-3 text-green-500" />
                  {feature}
                </div>
              ))}
            </div>

            <div className="rounded-md p-3 bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
              <strong>Setup required:</strong> Set{" "}
              <code className="text-amber-300">GITHUB_CLIENT_ID</code> and{" "}
              <code className="text-amber-300">GITHUB_CLIENT_SECRET</code> in your{" "}
              <code className="text-amber-300">.env</code> file, then register an OAuth app at{" "}
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                github.com/settings/developers
              </a>{" "}
              with callback URL <code className="text-amber-300">http://localhost:3000/api/auth/callback/github</code>.
            </div>

            <DialogFooter>
              <Button onClick={handleSignIn} className="w-full">
                <Github className="w-4 h-4 mr-2" />
                Sign in with GitHub
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
