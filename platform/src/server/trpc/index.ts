import { router } from "./trpc";
import { fleetRouter } from "./routers/fleet";
import { fieldsRouter } from "./routers/fields";
import { activitiesRouter } from "./routers/activities";
import { sensorsRouter } from "./routers/sensors";
import { marketplaceRouter } from "./routers/marketplace";
import { maintenanceRouter } from "./routers/maintenance";
import { analyticsRouter } from "./routers/analytics";
import { fuelRouter } from "./routers/fuel";
import { inventoryRouter } from "./routers/inventory";
import { agronomyRouter } from "./routers/agronomy";
import { fleetExtrasRouter } from "./routers/fleet-extras";
import { integrationsRouter } from "./routers/integrations";
import { liveDataRouter } from "./routers/live-data";

export const appRouter = router({
  fleet: fleetRouter,
  fields: fieldsRouter,
  activities: activitiesRouter,
  sensors: sensorsRouter,
  marketplace: marketplaceRouter,
  maintenance: maintenanceRouter,
  analytics: analyticsRouter,
  fuel: fuelRouter,
  inventory: inventoryRouter,
  agronomy: agronomyRouter,
  fleetExtras: fleetExtrasRouter,
  integrations: integrationsRouter,
  liveData: liveDataRouter,
});

export type AppRouter = typeof appRouter;
