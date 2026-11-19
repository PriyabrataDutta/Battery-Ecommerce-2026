import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Car, Battery } from "lucide-react";
import type { CarBrand, CarModel } from "@/types/catalog";

export function FitmentSearch({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"car" | "inverter">("car");
  const [carBrand, setCarBrand] = useState<string>("");
  const [carModel, setCarModel] = useState<string>("");
  const [capacity, setCapacity] = useState<string>("");

  const { data: brands = [] } = useQuery({
    queryKey: ["car_brands"],
    queryFn: async (): Promise<CarBrand[]> => {
      const { data, error } = await supabase.from("car_brands").select("*").order("sort_order");
      if (error) throw error;
      return data as CarBrand[];
    },
  });

  const { data: models = [] } = useQuery({
    queryKey: ["car_models", carBrand],
    enabled: !!carBrand,
    queryFn: async (): Promise<CarModel[]> => {
      const { data, error } = await supabase.from("car_models").select("*").eq("car_brand_id", carBrand).order("name");
      if (error) throw error;
      return data as CarModel[];
    },
  });

  useEffect(() => { setCarModel(""); }, [carBrand]);

  const onFind = () => {
    if (tab === "car") {
      const params = new URLSearchParams();
      if (carBrand) {
        const b = brands.find((b) => b.id === carBrand);
        if (b) params.set("car_brand", b.slug);
      }
      if (carModel) {
        const m = models.find((m) => m.id === carModel);
        if (m) params.set("car_model", m.slug);
      }
      navigate(`/shop/car-batteries${params.size ? `?${params}` : ""}`);
    } else {
      const params = new URLSearchParams();
      if (capacity) params.set("min_capacity", capacity);
      navigate(`/shop/inverter-batteries${params.size ? `?${params}` : ""}`);
    }
  };

  const fieldsCols = embedded ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3";

  return (
    <div className={embedded ? "" : "container-x"}>
      <div className={embedded ? "" : "rounded-3xl border border-line bg-white p-2 shadow-elevated"}>
        {/* Tabs */}
        <div className={`flex gap-1 ${embedded ? "rounded-full border border-line p-1" : "w-fit rounded-full bg-muted p-1 m-2 sm:m-3"}`}>
          <button
            onClick={() => setTab("car")}
            className={`flex-1 ${embedded ? "px-2 py-2.5 text-[11px]" : "sm:flex-none px-5 py-2 text-sm"} font-semibold rounded-full flex items-center justify-center gap-1.5 transition-colors ${
              tab === "car" ? "bg-ink text-white shadow-card" : "text-ink/70 hover:text-ink"
            }`}
          >
            <Car className="h-3.5 w-3.5" /> Car
          </button>
          <button
            onClick={() => setTab("inverter")}
            className={`flex-1 ${embedded ? "px-2 py-2.5 text-[11px]" : "sm:flex-none px-5 py-2 text-sm"} font-semibold rounded-full flex items-center justify-center gap-1.5 transition-colors ${
              tab === "inverter" ? "bg-ink text-white shadow-card" : "text-ink/70 hover:text-ink"
            }`}
          >
            <Battery className="h-3.5 w-3.5" /> Inverter
          </button>
        </div>

        {/* Fields */}
        <div className={embedded ? "pt-3" : "px-3 pb-3 sm:px-4 sm:pb-4"}>
          {tab === "car" ? (
            <div className={`grid ${fieldsCols} gap-2.5`}>
              <Select value={carBrand} onValueChange={setCarBrand}>
                <SelectTrigger className="h-12 rounded-xl border-line bg-muted/40"><SelectValue placeholder="Car Brand" /></SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={carModel} onValueChange={setCarModel} disabled={!carBrand}>
                <SelectTrigger className="h-12 rounded-xl border-line bg-muted/40"><SelectValue placeholder="Car Model" /></SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {models.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={onFind} className="h-12">
                <Search className="h-4 w-4 mr-2" /> Find my battery
              </Button>
            </div>
          ) : (
            <div className={`grid ${fieldsCols} gap-2.5`}>
              <Select value={capacity} onValueChange={setCapacity}>
                <SelectTrigger className="h-12 rounded-xl border-line bg-muted/40"><SelectValue placeholder="Capacity (Ah)" /></SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="80">Up to 100 Ah</SelectItem>
                  <SelectItem value="100">100 Ah</SelectItem>
                  <SelectItem value="150">150 Ah</SelectItem>
                  <SelectItem value="200">200 Ah & above</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="h-12 rounded-xl border-line bg-muted/40"><SelectValue placeholder="Use case" /></SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="home">Home (1-2 BHK)</SelectItem>
                  <SelectItem value="big-home">Home (3-4 BHK)</SelectItem>
                  <SelectItem value="shop">Shop / Office</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={onFind} className="h-12">
                <Search className="h-4 w-4 mr-2" /> Find battery
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
