import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, LogOut, User, Shield } from "lucide-react";

export function AuthToggle() {
  const { isAuthenticated, login, logout, user } = useAuth();

  if (isAuthenticated && user) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Authenticated</span>
                  <Badge variant="default" className="bg-green-600">Admin</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
              <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <span className="font-medium">Guest User</span>
              <p className="text-sm text-muted-foreground">Login to edit locations and IoT settings</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={login}
            className="flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Login as Admin
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}