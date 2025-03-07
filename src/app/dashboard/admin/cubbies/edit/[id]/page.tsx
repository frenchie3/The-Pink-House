"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { createClient } from "../../../../../../../supabase/client";

export default function EditCubbyPage() {
  const [cubbyNumber, setCubbyNumber] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const cubbyId = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    const fetchCubby = async () => {
      try {
        const { data, error } = await supabase
          .from("cubbies")
          .select("*")
          .eq("id", cubbyId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Cubby not found");

        setCubbyNumber(data.cubby_number);
        setLocation(data.location || "");
      } catch (err) {
        console.error("Error fetching cubby:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load cubby details",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCubby();
  }, [cubbyId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!cubbyNumber.trim()) {
      setError("Cubby number is required");
      setIsSubmitting(false);
      return;
    }

    try {
      // Check if cubby number already exists (excluding current cubby)
      const { data: existingCubby } = await supabase
        .from("cubbies")
        .select("id")
        .eq("cubby_number", cubbyNumber.trim())
        .neq("id", cubbyId)
        .single();

      if (existingCubby) {
        setError("A cubby with this number already exists");
        setIsSubmitting(false);
        return;
      }

      // Update cubby
      const { error: updateError } = await supabase
        .from("cubbies")
        .update({
          cubby_number: cubbyNumber.trim(),
          location: location.trim() || "Main Floor",
          updated_at: new Date().toISOString(),
        })
        .eq("id", cubbyId);

      if (updateError) throw updateError;

      // Redirect back to cubbies list
      router.push("/dashboard/admin/cubbies");
      router.refresh();
    } catch (err) {
      console.error("Error updating cubby:", err);
      setError(err instanceof Error ? err.message : "Failed to update cubby");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <DashboardNavbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-pink-600" />
              <p className="text-gray-600">Loading cubby details...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Cubby</h1>
              <p className="text-gray-600 mt-1">Update cubby details</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/admin/cubbies")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cubbies
            </Button>
          </header>

          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Cubby Details</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cubby_number">Cubby Number *</Label>
                  <Input
                    id="cubby_number"
                    value={cubbyNumber}
                    onChange={(e) => setCubbyNumber(e.target.value)}
                    placeholder="A1"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Enter a unique identifier for this cubby (e.g., A1, B2,
                    etc.)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Main Floor"
                  />
                  <p className="text-xs text-gray-500">
                    Specify where this cubby is located in the shop
                  </p>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/admin/cubbies")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-700"
                    disabled={isSubmitting}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
