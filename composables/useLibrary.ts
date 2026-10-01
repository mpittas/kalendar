export type LibraryTab = "activities" | "categories";

/** Open/tab state of the one dialog for managing activities and categories. */
export const useLibrary = () => {
  const open = useState("library-open", () => false);
  const tab = useState<LibraryTab>("library-tab", () => "activities");

  const show = (next: LibraryTab = "activities") => {
    tab.value = next;
    open.value = true;
  };
  const hide = () => {
    open.value = false;
  };

  return { open, tab, show, hide };
};
