import AppNav from "@/components/AppNav";
import NewProjectForm from "./NewProjectForm";

export default function NewProjectPage() {
  return (
    <>
      <AppNav />
      <main className="min-h-screen bg-sm-bg">
        <NewProjectForm />
      </main>
    </>
  );
}
