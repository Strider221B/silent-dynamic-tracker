import AuthBarrier from "@/components/auth/AuthBarrier";
import AuthProvider from "@/context/AuthContext";
import DriveSyncProvider from "@/context/DriveSyncContext";

/**
 * Root application component wrapping state providers and auth gate.
 */
export function App() {
  return (
    <AuthProvider>
      <DriveSyncProvider>
        <AuthBarrier>
          <div data-testid="app-dashboard">
            <h1>Silent Dynamic Tracker</h1>
          </div>
        </AuthBarrier>
      </DriveSyncProvider>
    </AuthProvider>
  );
}

export default App;

