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
      params.set("type", "car-batteries");
      if (carBrand) {
        const b = brands.find((b) => b.id === carBrand);
        if (b) params.set("car_brand", b.slug);
      }
      if (carModel) {
        const m = models.find((m) => m.id === carModel);
        if (m) params.set("car_model", m.slug);
      }
      navigate(`/shop?${params.toString()}`);
    } else {
      const params = new URLSearchParams({ type: "inverter-ups" });
      if (capacity) params.set("min_capacity", capacity);
      navigate(`/shop?${params.toString()}`);
    }
  };

  return (
    <div className={embedded ? "" : "container-x"}>
      <div className="bg-white border border-line shadow-elevated">
        {/* Tabs */}
        <div className="flex border-b border-line">
          <button
            onClick={() => setTab("car")}
            className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
              tab === "car" ? "bg-primary text-primary-foreground" : "bg-white text-ink hover:text-primary"
            }`}
          >
            <Car className="h-4 w-4" /> Car Battery
          </button>
          <button
            onClick={() => setTab("inverter")}
            className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
              tab === "inverter" ? "bg-primary text-primary-foreground" : "bg-white text-ink hover:text-primary"
            }`}
          >
            <Battery className="h-4 w-4" /> Inverter Battery
          </button>
        </div>

        {/* Fields */}
        <div className="p-4 sm:p-5">
          {tab === "car" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={carBrand} onValueChange={setCarBrand}>
                <SelectTrigger className="h-12 border-line"><SelectValue placeholder="Select Car Brand" /></SelectTrigger>
                <SelectContent className="bg-white">
                  {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={carModel} onValueChange={setCarModel} disabled={!carBrand}>
                <SelectTrigger className="h-12 border-line"><SelectValue placeholder="Select Car Model" /></SelectTrigger>
                <SelectContent className="bg-white">
                  {models.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={onFind} className="h-12 font-bold uppercase tracking-wider">
                <Search className="h-4 w-4 mr-2" /> Find My Battery
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={capacity} onValueChange={setCapacity}>
                <SelectTrigger className="h-12 border-line"><SelectValue placeholder="Capacity (Ah)" /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="80">Up to 100 Ah</SelectItem>
                  <SelectItem value="100">100 Ah</SelectItem>
                  <SelectItem value="150">150 Ah</SelectItem>
                  <SelectItem value="200">200 Ah & above</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="h-12 border-line"><SelectValue placeholder="Use case" /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="home">Home (1-2 BHK)</SelectItem>
                  <SelectItem value="big-home">Home (3-4 BHK)</SelectItem>
                  <SelectItem value="shop">Shop / Office</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={onFind} className="h-12 font-bold uppercase tracking-wider">
                <Search className="h-4 w-4 mr-2" /> Find Battery
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
