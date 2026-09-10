import { useState } from 'react';
import { Truck, CarFront, Gauge, Check } from 'lucide-react';
import { useStore } from '../../api/store';
import { PageHeader } from '../../components/common';
import { VEHICLE_CLASS_META, cn } from '../../utils/severity';
import { VEHICLE_CLASSES } from '../../data/vehicles';
import type { VehicleType } from '../../types';

export default function VehicleProfile() {
  const { api } = useStore();
  const vehicle = api.getVehicle();
  const [, force] = useState(0);
  const [saved, setSaved] = useState(false);

  const setVehicle = (type: VehicleType) => {
    const cls = VEHICLE_CLASSES.find((c) => c.type === type)!;
    api.setVehicle({
      ...vehicle,
      type,
      name: type === vehicle.type ? vehicle.name : VEHICLE_CLASS_META[type],
      groundClearanceMm: cls.typicalClearanceMm,
    });
    setSaved(true);
    force((n) => n + 1);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Vehicle" sub="Drives your risk estimates" />

      <section className="card card-pad flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary-500/15 text-primary-300" aria-hidden>
          <Truck className="h-7 w-7" />
        </div>
        <div>
          <div className="text-lg font-bold text-ink">{vehicle.name}</div>
          <div className="text-sm text-gray-400">{VEHICLE_CLASS_META[vehicle.type]}</div>
        </div>
      </section>

      <section className="card card-pad grid grid-cols-2 gap-4">
        <div>
          <div className="label-xs">Ground clearance</div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-xl font-bold text-ink">{vehicle.groundClearanceMm}</span>
            <span className="text-xs text-gray-400">mm</span>
          </div>
        </div>
        <div>
          <div className="label-xs">Sensitivity</div>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Gauge className="h-4 w-4 text-gray-400" aria-hidden /> Medium
          </div>
        </div>
      </section>

      <section className="card card-pad">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
          <CarFront className="h-4 w-4" aria-hidden /> Switch vehicle class
        </h3>
        <p className="mb-3 text-xs text-gray-400">
          Driveability and route risk adjust for the selected class — e.g. a pothole that is high-risk for a motorcycle is lower-risk for an SUV.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {VEHICLE_CLASSES.map((c) => (
            <button
              key={c.type}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors',
                vehicle.type === c.type
                  ? 'border-primary-600 bg-primary-500/15 text-primary-300'
                  : 'border-line bg-card text-gray-400 hover:border-line',
              )}
              onClick={() => setVehicle(c.type)}
              aria-pressed={vehicle.type === c.type}
            >
              {c.label}
            </button>
          ))}
        </div>
        {saved && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-green-300">
            <Check className="h-3.5 w-3.5" aria-hidden /> Vehicle updated — scores across the app now use {VEHICLE_CLASS_META[vehicle.type]}.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-xs text-blue-300">
        Vehicle database is mocked. Class sensitivities are illustrative estimates, not measurements.
      </section>
    </div>
  );
}
