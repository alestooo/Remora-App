export const calculateClientTotal = (products = []) => products.reduce((sum, product) => sum + Number(product.price || 0), 0);
export const formatCRC = (value) => Number(value || 0).toLocaleString("es-CR");
