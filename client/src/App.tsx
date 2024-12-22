import { Switch, Route } from "wouter";
import { Home } from "@/pages/Home";
import { Interview } from "@/pages/Interview";

function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/interview/:id" component={Interview} />
      <Route>
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">404 Page Not Found</h1>
            <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

export default App;
