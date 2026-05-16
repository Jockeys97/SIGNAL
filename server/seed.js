import { initialLeads } from "../src/data.ts";
import { countLeads, upsertLead } from "./db.js";

if (countLeads() === 0) {
  for (const lead of initialLeads) {
    upsertLead(lead);
  }

  console.log(`Seeded ${initialLeads.length} leads`);
} else {
  console.log(`Database already has ${countLeads()} leads`);
}
