import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchDepartments } from "../api/departments";
import {
  changePassword,
  createAdminPerson,
  deleteAdminPerson,
  fetchAdminPeople,
  resetAdminPersonPassword,
  updateAdminPerson,
  updateProfile
} from "../api/profile";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import type { Department, Person, UserRole } from "../types";

const roles: UserRole[] = ["ADMIN", "MANAGER", "USER"];

export function ProfilePage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [resettingPerson, setResettingPerson] = useState<Person | null>(null);

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments
  });

  const adminPeopleQuery = useQuery({
    queryKey: ["admin-people"],
    queryFn: fetchAdminPeople,
    enabled: auth.user?.role === "ADMIN"
  });

  const departments = departmentsQuery.data ?? [];

  return (
    <main className="min-h-screen bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600" to="/">
          <ArrowLeft size={16} />
          Back to projects
        </Link>

        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your personal details and password.</p>
          </div>
          <Button variant="secondary" onClick={auth.logout}>
            Log out
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {auth.user ? <ProfileForm user={auth.user} onSaved={auth.refreshUser} /> : null}
          <PasswordForm />
        </div>

        {auth.user?.role === "ADMIN" ? (
          <section className="mt-8 rounded-lg border border-line bg-white">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <h2 className="font-semibold">People Management</h2>
                <p className="text-sm text-slate-500">Admin-only user management.</p>
              </div>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus size={16} />
                Create Person
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-center text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(adminPeopleQuery.data ?? []).map((person) => (
                    <tr key={person.id}>
                      <td className="px-4 py-3">{person.name}</td>
                      <td className="px-4 py-3">{person.email}</td>
                      <td className="px-4 py-3">{person.contactNumber ?? "-"}</td>
                      <td className="px-4 py-3">{person.department?.name ?? "No department"}</td>
                      <td className="px-4 py-3">{person.role}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <Button variant="secondary" className="h-8 px-2" onClick={() => setEditingPerson(person)}>
                            Edit
                          </Button>
                          <Button variant="secondary" className="h-8 px-2" onClick={() => setResettingPerson(person)}>
                            Reset Password
                          </Button>
                          <Button
                            variant="danger"
                            className="h-8 px-2"
                            disabled={person.id === auth.user?.id}
                            onClick={async () => {
                              if (window.confirm(`Delete ${person.name}?`)) {
                                await deleteAdminPerson(person.id);
                                queryClient.invalidateQueries({ queryKey: ["admin-people"] });
                              }
                            }}
                          >
                            <Trash2 size={15} />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>

      {isCreateOpen ? (
        <Modal title="Create person" onClose={() => setIsCreateOpen(false)}>
          <PersonForm
            departments={departments}
            onSubmit={async (payload) => {
              await createAdminPerson({ ...payload, password: payload.password || "user123" });
              queryClient.invalidateQueries({ queryKey: ["admin-people"] });
              setIsCreateOpen(false);
            }}
            requirePassword
          />
        </Modal>
      ) : null}

      {editingPerson ? (
        <Modal title="Edit person" onClose={() => setEditingPerson(null)}>
          <PersonForm
            departments={departments}
            person={editingPerson}
            onSubmit={async (payload) => {
              await updateAdminPerson(editingPerson.id, payload);
              queryClient.invalidateQueries({ queryKey: ["admin-people"] });
              if (editingPerson.id === auth.user?.id) {
                auth.refreshUser();
              }
              setEditingPerson(null);
            }}
          />
        </Modal>
      ) : null}

      {resettingPerson ? (
        <Modal title="Reset password" onClose={() => setResettingPerson(null)}>
          <ResetPasswordForm
            onSubmit={async (password) => {
              await resetAdminPersonPassword(resettingPerson.id, password);
              setResettingPerson(null);
            }}
          />
        </Modal>
      ) : null}
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

function PersonForm({
  person,
  departments,
  requirePassword,
  onSubmit
}: {
  person?: Person;
  departments: Department[];
  requirePassword?: boolean;
  onSubmit: (payload: {
    name: string;
    email: string;
    contactNumber: string | null;
    departmentId: number | null;
    role: UserRole;
    password?: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(person?.name ?? "");
  const [email, setEmail] = useState(person?.email ?? "");
  const [contactNumber, setContactNumber] = useState(person?.contactNumber ?? "");
  const [departmentId, setDepartmentId] = useState(person?.departmentId ?? 0);
  const [role, setRole] = useState<UserRole>(person?.role ?? "USER");
  const [password, setPassword] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit({
          name,
          email,
          contactNumber: contactNumber || null,
          departmentId: departmentId || null,
          role,
          password
        });
      }}
    >
      <Input label="Name" value={name} onChange={setName} />
      <Input label="Email" type="email" value={email} onChange={setEmail} />
      <Input label="Contact number" value={contactNumber} onChange={setContactNumber} />
      <label className="block">
        <span className="text-sm font-medium">Department</span>
        <select
          className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
          value={departmentId}
          onChange={(event) => setDepartmentId(Number(event.target.value))}
        >
          <option value={0}>No department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Role</span>
        <select
          className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
        >
          {roles.map((roleValue) => (
            <option key={roleValue} value={roleValue}>
              {roleValue}
            </option>
          ))}
        </select>
      </label>
      {requirePassword ? (
        <Input label="Password" type="password" value={password} onChange={setPassword} />
      ) : null}
      <Button type="submit">Save Person</Button>
    </form>
  );
}

function ResetPasswordForm({ onSubmit }: { onSubmit: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit(password);
      }}
    >
      <Input label="New password" type="password" value={password} onChange={setPassword} />
      <Button type="submit">Reset Password</Button>
    </form>
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
