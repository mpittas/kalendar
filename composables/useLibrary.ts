/** What the dialog should do as it opens. */
export type LibraryFocus = { kind: "new-activity" } | { kind: "new-category" } | { kind: "edit"; id: string } | null;

/** Open state of the one dialog for managing activities and categories. */
export const useLibrary = () => {
  const open = useState("library-open", () => false);
  const focus = useState<LibraryFocus>("library-focus", () => null);

  const show = (next: LibraryFocus = null) => {
    focus.value = next;
    open.value = true;
  };
  const hide = () => {
    open.value = false;
  };

  return { open, focus, show, hide };
};
