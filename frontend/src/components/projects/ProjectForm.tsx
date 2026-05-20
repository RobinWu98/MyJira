import { useState } from "react";
import type { Person, ProjectSummary } from "../../types";
import { Button } from "../ui/Button";

type ProjectFormProps = {
  people: Person[];
  project?: ProjectSummary;
  onSubmit: (payload: {
    name: string;
    description: string | null;
    createdByPersonId: number;
  }) => void;
  isSubmitting: boolean;
};

export function ProjectForm({ people, project, onSubmit, isSubmitting }: ProjectFormProps) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [createdByPersonId, setCreatedByPersonId] = useState(
    project?.createdByPersonId ?? people[0]?.id ?? 0
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          name,
          description: description.trim() || null,
          createdByPersonId
        });
      }}
    >
      <label className="block">
        <span className="text-sm font-medium">Project name</span>
        <input
          className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Description</span>
        <textarea
          className="focus-ring mt-1 min-h-24 w-full rounded-md border border-line px-3 py-2"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Created by</span>
        <select
          className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
          value={createdByPersonId}
          onChange={(event) => setCreatedByPersonId(Number(event.target.value))}
          required
        >
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !people.length}>
          {project ? "Save Project" : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
