import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { EmojiProvider } from "react-apple-emojis";
import emojiData from "react-apple-emojis/src/data.json";
import Home from "@/pages/home";
import AddLocation from "@/pages/add-location";
import SensorDashboardPage from "@/pages/sensor-dashboard-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/add-location" component={AddLocation} />
      <Route path="/sensors/:locationId" component={SensorDashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <EmojiProvider data={emojiData}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </EmojiProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
