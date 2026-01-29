import { api } from "@/lib/api";

type Product = {
  _id: string;
  name: string;
  basePrice: number;
  category: string;
};

export default async function Home() {
  const res = await api("/api/products");

  const products: Product[] = res.data || [];

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-6">Ibag Couture</h1>

      {products.length === 0 ? (
        <p>Aucun produit pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="border rounded-lg p-4 shadow-sm"
            >
              <h2 className="font-semibold text-lg">{product.name}</h2>
              <p className="text-gray-600">
                {product.category}
              </p>
              <p className="font-bold mt-2">
                À partir de {product.basePrice} FCFA
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}