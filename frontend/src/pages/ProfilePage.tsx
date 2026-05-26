import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { changePassword, updateProfile } from "../api/profile";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/Button";
import type { Person } from "../types";

export function ProfilePage() {
  const auth = useAuth();

  return (
    <main className="min-h-screen bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600" to="/">
          <ArrowLeft size={16} />
          Back to company tasks
        </Link>

        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your personal details and password.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {auth.user?.role === "ADMIN" ? (
              <Link
                className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-ink transition hover:bg-slate-50"
                to="/admin/people"
              >
                <Users size={16} />
                People Management
              </Link>
            ) : null}
            <Button variant="secondary" onClick={auth.logout}>
              Log out
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {auth.user ? <ProfileForm user={auth.user} onSaved={auth.refreshUser} /> : null}
          <PasswordForm />
        </div>
      </div>
    </main>
  );
}

function ProfileForm({ user, onSaved }: { user: Person; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(user.name);
  const [contactNumber, setContactNumber] = useState(user.contactNumber ?? "");
  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: onSaved
  });

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="font-semibold">Personal Details</h2>
      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({ name, contactNumber: contactNumber || null });
        }}
      >
        <Input label="Name" value={name} onChange={setName} />
        <Input label="Email" value={user.email} onChange={() => {}} disabled />
        <Input label="Contact number" value={contactNumber} onChange={setContactNumber} />
        <Input label="Department" value={user.department?.name ?? "No department"} onChange={() => {}} disabled />
        <Input label="Role" value={user.role} onChange={() => {}} disabled />
        <Button type="submit" disabled={mutation.isPending}>
          Save Profile
        </Button>
      </form>
    </section>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated");
    },
    onError: () => setMessage("Could not update password")
  });

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="font-semibold">Password</h2>
      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate({ currentPassword, newPassword, confirmPassword });
        }}
      >
        <Input label="Current password" type="password" value={currentPassword} onChange={setCurrentPassword} />
        <Input label="New password" type="password" value={newPassword} onChange={setNewPassword} />
        <Input label="Confirm new password" type="password" value={confirmPassword} onChange={setConfirmPassword} />
        {message ? <div className="text-sm text-slate-600">{message}</div> : null}
        <Button type="submit" disabled={mutation.isPending}>
          Change Password
        </Button>
      </form>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  disabled
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500"
        disabled={disabled}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
