import { useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { NOTES_PER_PAGE } from "../constants/app";
import { createNoteId } from "../utils/taskHelpers";

const EMPTY_NOTE_FORM = {
  title: "",
  content: "",
  color: "note-red",
  pinned: false,
  blocks: [],
};

export default function useNotesWorkspace({ user, notes, setNotes, showAlert, closeAlert }) {
  const [form, setForm] = useState(EMPTY_NOTE_FORM);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("create");
  const [errors, setErrors] = useState({});
  const [page, setPage] = useState(1);
  const [reorderMode, setReorderMode] = useState(false);
  const [search, setSearch] = useState("");
  const [menuId, setMenuId] = useState(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const base = [...notes].sort((a, b) => {
      if ((a.pinned ?? false) !== (b.pinned ?? false)) return a.pinned ? -1 : 1;
      return Number(a.position || 0) - Number(b.position || 0);
    });
    if (!needle) return base;
    return base.filter((note) => {
      const blocks = (note.blocks || []).map((block) => JSON.stringify(block)).join(" ");
      return `${note.title || ""} ${note.content || ""} ${blocks}`.toLowerCase().includes(needle);
    });
  }, [notes, search]);

  const visibleNotes = filtered.slice((page - 1) * NOTES_PER_PAGE, page * NOTES_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / NOTES_PER_PAGE));

  const openCreate = () => {
    setMode("create");
    setForm(EMPTY_NOTE_FORM);
    setSelectedNote(null);
    setErrors({});
    setShowModal(true);
  };

  const fillFromNote = (note, nextMode) => {
    setMode(nextMode);
    setSelectedNote(note);
    setForm({
      title: note.title || "",
      content: note.content || "",
      color: note.color || "note-red",
      pinned: note.pinned || false,
      blocks: note.blocks || [],
    });
    setErrors({});
    setShowModal(true);
  };

  const openView = (note) => fillFromNote(note, "view");
  const openEdit = (note) => {
    setMenuId(null);
    fillFromNote(note, "edit");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedNote(null);
    setForm(EMPTY_NOTE_FORM);
    setErrors({});
    setMode("create");
  };

  const save = async () => {
    if (!form.title.trim()) {
      setErrors({ title: "Agrega un título." });
      return;
    }

    const blocks = (form.blocks || []).map((block) =>
      block.type === "checklist"
        ? { ...block, items: (block.items || []).filter((item) => item.text.trim()) }
        : block
    );

    if (mode === "edit" && selectedNote) {
      await updateDoc(doc(db, "users", user.uid, "notes", selectedNote.id), {
        ...form,
        blocks,
        updatedAt: serverTimestamp(),
      });
    } else {
      const noteRef = doc(collection(db, "users", user.uid, "notes"));
      await setDoc(noteRef, {
        ...form,
        blocks,
        id: noteRef.id,
        position: notes.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    closeModal();
  };

  const remove = (noteId) =>
    showAlert({
      type: "danger",
      title: "Eliminar nota",
      message: "¿Seguro que quieres eliminar esta nota?",
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        await deleteDoc(doc(db, "users", user.uid, "notes", noteId));
        closeAlert();
        closeModal();
      },
    });

  const togglePinned = async (note) => {
    const pinned = !note.pinned;
    setNotes((current) => current.map((item) => item.id === note.id ? { ...item, pinned } : item));
    setSelectedNote((current) => current?.id === note.id ? { ...current, pinned } : current);
    await updateDoc(doc(db, "users", user.uid, "notes", note.id), { pinned, updatedAt: serverTimestamp() });
    setMenuId(null);
  };

  const addTextBlock = () => setForm({ ...form, blocks: [...form.blocks, { id: createNoteId(), type: "text", text: "" }] });
  const addChecklistBlock = () => setForm({
    ...form,
    blocks: [
      ...form.blocks,
      {
        id: createNoteId(),
        type: "checklist",
        title: `Checklist ${form.blocks.filter((block) => block.type === "checklist").length + 1}`,
        items: [{ id: createNoteId(), text: "", done: false }],
      },
    ],
  });
  const addPendingBlock = () => setForm({ ...form, blocks: [...form.blocks, { id: createNoteId(), type: "pending", person: "", amount: "" }] });
  const updateBlock = (blockId, field, value) => setForm({ ...form, blocks: form.blocks.map((block) => block.id === blockId ? { ...block, [field]: value } : block) });
  const removeBlock = (blockId) => setForm({ ...form, blocks: form.blocks.filter((block) => block.id !== blockId) });
  const addChecklistItem = (blockId) => setForm({
    ...form,
    blocks: form.blocks.map((block) => block.id === blockId
      ? { ...block, items: [...(block.items || []), { id: createNoteId(), text: "", done: false }] }
      : block),
  });
  const updateChecklistItem = (blockId, itemId, field, value) => setForm({
    ...form,
    blocks: form.blocks.map((block) => block.id === blockId
      ? { ...block, items: block.items.map((item) => item.id === itemId ? { ...item, [field]: value } : item) }
      : block),
  });

  const toggleChecklistItemInNote = async (note, blockId, itemId) => {
    const blocks = (note.blocks || []).map((block) => block.id === blockId
      ? { ...block, items: (block.items || []).map((item) => item.id === itemId ? { ...item, done: !item.done } : item) }
      : block);
    const updated = { ...note, blocks };
    setSelectedNote((current) => current?.id === note.id ? updated : current);
    setNotes((current) => current.map((item) => item.id === note.id ? updated : item));
    await updateDoc(doc(db, "users", user.uid, "notes", note.id), { blocks, updatedAt: serverTimestamp() });
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = notes.findIndex((note) => note.id === active.id);
    const newIndex = notes.findIndex((note) => note.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(notes, oldIndex, newIndex);
    setNotes(reordered);
    const batch = writeBatch(db);
    reordered.forEach((note, index) => batch.update(doc(db, "users", user.uid, "notes", note.id), { position: index, updatedAt: serverTimestamp() }));
    await batch.commit();
  };

  const formatDate = (note) => note?.createdAt?.toDate
    ? note.createdAt.toDate().toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" })
    : "Hoy";

  return {
    form, setForm,
    selectedNote,
    showModal,
    mode,
    errors,
    page, setPage,
    reorderMode, setReorderMode,
    search, setSearch,
    menuId, setMenuId,
    visibleNotes,
    totalPages,
    openCreate,
    openView,
    openEdit,
    closeModal,
    save,
    remove,
    togglePinned,
    addTextBlock,
    addChecklistBlock,
    addPendingBlock,
    updateBlock,
    removeBlock,
    addChecklistItem,
    updateChecklistItem,
    toggleChecklistItemInNote,
    handleDragEnd,
    formatDate,
  };
}
