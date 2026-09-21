import { useState } from "react";
import { collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { calculateClientTotal } from "../utils/currency";

const EMPTY_CLIENT_FORM = {
  name: "",
  products: [{ name: "", price: "" }],
  paid: false,
};

export default function useClientsWorkspace({ user, showAlert, closeAlert }) {
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_CLIENT_FORM);
  const [errors, setErrors] = useState({});

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_CLIENT_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (client) => {
    setEditingId(client.id);
    setForm({
      name: client.name || "",
      products: client.products?.length ? client.products : [{ name: "", price: "" }],
      paid: client.paid || false,
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_CLIENT_FORM);
    setErrors({});
  };

  const addProduct = () => setForm({ ...form, products: [...form.products, { name: "", price: "" }] });
  const updateProduct = (index, field, value) => setForm({ ...form, products: form.products.map((product, i) => i === index ? { ...product, [field]: value } : product) });
  const removeProduct = (index) => setForm({
    ...form,
    products: form.products.length > 1 ? form.products.filter((_, i) => i !== index) : [{ name: "", price: "" }],
  });

  const save = async () => {
    if (!form.name.trim()) {
      setErrors({ name: "Agrega el nombre de la persona." });
      return;
    }
    const products = form.products.filter((product) => product.name.trim() || product.price.trim());
    const data = { ...form, products, total: calculateClientTotal(products), updatedAt: serverTimestamp() };

    if (editingId) {
      await updateDoc(doc(db, "users", user.uid, "clients", editingId), data);
    } else {
      const clientRef = doc(collection(db, "users", user.uid, "clients"));
      await setDoc(clientRef, { ...data, id: clientRef.id, createdAt: serverTimestamp() });
    }
    closeModal();
  };

  const togglePaid = (client) => updateDoc(doc(db, "users", user.uid, "clients", client.id), { paid: !client.paid, updatedAt: serverTimestamp() });

  const remove = (id) => showAlert({
    type: "danger",
    title: "Eliminar cliente",
    message: "¿Seguro que quieres eliminar este cliente?",
    confirmText: "Sí, eliminar",
    cancelText: "Cancelar",
    onConfirm: async () => {
      await deleteDoc(doc(db, "users", user.uid, "clients", id));
      closeAlert();
    },
  });

  return {
    editingId,
    showModal,
    form, setForm,
    errors,
    openCreate,
    openEdit,
    closeModal,
    addProduct,
    updateProduct,
    removeProduct,
    save,
    togglePaid,
    remove,
  };
}
