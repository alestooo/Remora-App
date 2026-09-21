import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import NoteCard from "./NoteCard";
export default function SortableNote(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.note.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : "auto" };
  return <NoteCard {...props} dragRef={setNodeRef} dragStyle={style} dragAttributes={attributes} dragListeners={listeners} isDragging={isDragging} />;
}
