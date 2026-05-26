import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";
import { changePassword, updateProfile } from "../api/profile";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import type { Person } from "../types";

export function ProfilePage() {
  const auth = useAuth();
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  return (
    <main className="min-h-screen bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
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

        {auth.user ? (
          <ProfileForm
            user={auth.user}
            onChangePassword={() => setIsPasswordOpen(true)}
            onSaved={auth.refreshUser}
          />
        ) : null}
      </div>

      {isPasswordOpen ? (
        <Modal title="Change password" onClose={() => setIsPasswordOpen(false)}>
          <PasswordForm onSaved={() => setIsPasswordOpen(false)} />
        </Modal>
      ) : null}
    </main>
  );
}

function ProfileForm({
  user,
  onChangePassword,
  onSaved
}: {
  user: Person;
  onChangePassword: () => void;
  onSaved: () => Promise<void>;
}) {
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
      <div className="mt-5 border-t border-line pt-4">
        <Button variant="secondary" onClick={onChangePassword}>
          Change Password
        </Button>
      </div>
    </section>
  );
}

function PasswordForm({ onSaved }: { onSaved: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState({
    current: false,
    next: false,
    confirm: false
  });
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSaved();
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setError(formatPasswordError(error.message));
        return;
      }

      setError("Password could not be updated. Please try again.");
    }
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        mutation.mutate({ currentPassword, newPassword, confirmPassword });
      }}
    >
      <div className="rounded-md border border-line bg-slate-50 px-3 py-2 text-sm text-slate-600">
        Password must be at least 6 characters. New password and confirmation must match.
      </div>
      <PasswordInput
        isVisible={visiblePasswords.current}
        label="Current password"
        value={currentPassword}
        onChange={setCurrentPassword}
        onToggleVisibility={() =>
          setVisiblePasswords((current) => ({ ...current, current: !current.current }))
        }
      />
      <PasswordInput
        isVisible={visiblePasswords.next}
        label="New password"
        value={newPassword}
        onChange={setNewPassword}
        onToggleVisibility={() =>
          setVisiblePasswords((current) => ({ ...current, next: !current.next }))
        }
      />
      <PasswordInput
        isVisible={visiblePasswords.confirm}
        label="Confirm new password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        onToggleVisibility={() =>
          setVisiblePasswords((current) => ({ ...current, confirm: !current.confirm }))
        }
      />
      {error ? <div className="text-sm text-red-700">{error}</div> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          Save Password
        </Button>
      </div>
    </form>
  );
}

function formatPasswordError(message: string) {
  if (message === "Validation failed") {
    return "Check your password fields. Password must be at least 6 characters and both new password fields must match.";
  }

  return message;
}

function PasswordInput({
  label,
  value,
  isVisible,
  onChange,
  onToggleVisibility
}: {
  label: string;
  value: string;
  isVisible: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="relative mt-1">
        <input
          className="focus-ring w-full rounded-md border border-line px-3 py-2 pr-11"
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="focus-ring absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          onClick={onToggleVisibility}
          type="button"
        >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
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
