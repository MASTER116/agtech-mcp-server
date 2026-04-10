"use client";

import { trpc } from "@/lib/trpc";
import { useParams } from "next/navigation";
import { ArrowLeft, Tag, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

const LISTING_TYPES: Record<string, string> = { RENTAL: "Аренда", SERVICE: "Услуга", SALE: "Продажа" };

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: listing } = trpc.marketplace.getById.useQuery({ id });

  if (!listing) return <div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-64" /></div>;

  const category = listing.equipment?.category ? EQUIPMENT_CATEGORIES[listing.equipment.category as keyof typeof EQUIPMENT_CATEGORIES] : null;
  const price = listing.pricePerDay || listing.pricePerHour || listing.pricePerHa;
  const priceUnit = listing.pricePerDay ? "₽/день" : listing.pricePerHour ? "₽/час" : "₽/га";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/marketplace" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">{listing.title}</h1>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">{LISTING_TYPES[listing.type]}</span>
          {category && <span className="text-sm text-gray-500">{category.label}</span>}
          <span className="text-sm text-gray-500">{listing.org.name}</span>
        </div>

        {listing.description && <p className="text-gray-600">{listing.description}</p>}

        {price && (
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Tag className="h-5 w-5 text-gray-400" />
            {price.toLocaleString("ru-RU")} {priceUnit}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Доступность</p>
              <p className="text-sm">{formatDate(listing.availableFrom)} — {formatDate(listing.availableTo)}</p>
            </div>
          </div>
          {listing.regionName && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Регион</p>
                <p className="text-sm">{listing.regionName}{listing.radiusKm ? ` (${listing.radiusKm} км)` : ""}</p>
              </div>
            </div>
          )}
        </div>

        {listing.equipment && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">Техника</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Марка:</span> {listing.equipment.make}</div>
              <div><span className="text-gray-500">Модель:</span> {listing.equipment.model}</div>
              <div><span className="text-gray-500">Год:</span> {listing.equipment.year || "—"}</div>
              <div><span className="text-gray-500">Моточасы:</span> {listing.equipment.engineHours || "—"}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
