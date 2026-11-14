import AuthBarrier from "@/components/auth/AuthBarrier";
import ChecklistDashboard from "@/components/checklist/ChecklistDashboard";
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
          <ChecklistDashboard />
        </AuthBarrier>
      </DriveSyncProvider>
    </AuthProvider>
  );
}

export default App;
