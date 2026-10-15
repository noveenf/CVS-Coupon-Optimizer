"use client";

import { useState } from "react";

type Offer = {
  id: string;
  product_name: string;
  sale_price: number | null;
  coupon_amount: number | null;
  extrabucks_reward: number | null;
  conditions: string | null;
  source_image: string;
  reviewed: boolean;
};

type ExtractionResult = {
  dataset_id: string;
  offer_count: number;
  offers: Offer[];
  errors: string[];
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function extract() {
    if (!files.length) return;

    setLoading(true);
    setError("");

    const formData = new FormData();

    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const response = await fetch("http://localhost:8000/extract", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Extraction failed");
      }

      const data: ExtractionResult = await response.json();

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function downloadJSON() {
    if (!result) return;

    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `cvs-${result.dataset_id}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold">CVS Deal Optimizer</h1>
          <p className="mt-2 text-slate-600">Upload weekly ad screenshots to extract offers.</p>
        </header>

        <section className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Upload Weekly Ad</h2>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />

          <p className="my-4 text-sm text-slate-500">{files.length} screenshots selected</p>

          <button
            onClick={extract}
            disabled={loading || files.length === 0}
            className="rounded-lg bg-red-600 px-5 py-3 text-white disabled:opacity-50"
          >
            {loading ? "Extracting..." : "Extract Offers"}
          </button>

          {error && <p className="mt-4 text-red-600">{error}</p>}
        </section>

        {result && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Extracted {result.offer_count} Offers</h2>

              <button
                onClick={downloadJSON}
                className="rounded-lg bg-slate-900 px-4 py-2 text-white"
              >
                Download JSON
              </button>
            </div>

            {result.errors.length > 0 && (
              <p className="text-orange-700">Errors: {result.errors.join(", ")}</p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {result.offers.map((offer) => (
                <article key={offer.id} className="rounded-xl border bg-white p-5">
                  <h3 className="text-lg font-semibold">{offer.product_name}</h3>

                  <p>Sale Price: ${offer.sale_price?.toFixed(2) ?? "N/A"}</p>

                  <p>Coupon: ${offer.coupon_amount?.toFixed(2) ?? "N/A"}</p>

                  <p>ExtraBucks: ${offer.extrabucks_reward?.toFixed(2) ?? "N/A"}</p>

                  <p className="mt-2 text-sm text-slate-600">{offer.conditions}</p>

                  <p className="mt-3 text-xs text-slate-400">Source: {offer.source_image}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
