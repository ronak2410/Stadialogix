import { StadiumNode } from '@/types';

// Physical stadium layout. This is static config, not mock data.
// Live metrics (crowdDensity, etc.) are injected by the IoT State Manager.
export const stadiumConfig = {
  stadium: "New York New Jersey Stadium (MetLife - FIFA 2026)",
  capacity: 80663,
  nodes: [
    {
      id: "gate-verizon",
      type: "gate",
      name: "Verizon Gate (Northwest)",
      isAccessible: true,
      closestNodes: ["sec-101", "sec-149", "restroom-101", "vendor-hotdog-1"]
    },
    {
      id: "gate-sap",
      type: "gate",
      name: "SAP Gate (Southeast)",
      isAccessible: true,
      closestNodes: ["sec-113", "vendor-pizza-1", "transit-nj-rail"]
    },
    {
      id: "gate-pepsi",
      type: "gate",
      name: "Pepsi Gate (Northeast)",
      isAccessible: true,
      closestNodes: ["sec-126", "restroom-126", "merch-main"]
    },
    {
      id: "gate-budlight",
      type: "gate",
      name: "Bud Light Gate (Southwest)",
      isAccessible: true,
      closestNodes: ["sec-139", "vendor-taco-1", "medical-1"]
    },
    {
      id: "sec-100",
      type: "seating",
      name: "Lower Bowl (Sections 101-149)",
      isAccessible: true,
      details: "Closest to the pitch. High energy zone. Accessible seating available at the top of sections 111, 126, 139."
    },
    {
      id: "sec-200",
      type: "seating",
      name: "Mezzanine & Suites (Sections 201-250)",
      isAccessible: true,
      details: "Premium seating and club access. Includes Coaches Club and VIP suites."
    },
    {
      id: "sec-300",
      type: "seating",
      name: "Upper Bowl (Sections 301-350)",
      isAccessible: true,
      details: "Highest elevation. Steep incline. Escalators available at all major gates."
    },
    {
      id: "rideshare",
      type: "logistics",
      name: "Rideshare Pickup (Meadowlands Racing)",
      isAccessible: false,
      accessibleRouteFromGateVerizon: "Take the designated pedestrian walkway towards Meadowlands Racing and Entertainment. It is a 1.3-mile walk. Shuttles are available at Lot E for those needing assistance."
    },
    {
      id: "transit-nj-rail",
      type: "logistics",
      name: "NJ Transit Meadowlands Rail Line",
      isAccessible: true
    },
    {
      id: "vendor-pizza-1",
      type: "vendor",
      name: "Nonna's Pizzeria",
      offerings: ["pepperoni pizza", "cheese pizza", "soda"],
      isAccessible: true,
      location: "Lower Bowl Concourse near Section 113"
    },
    {
      id: "vendor-taco-1",
      type: "vendor",
      name: "Global Tacos",
      offerings: ["beef tacos", "chicken tacos", "margarita", "water"],
      isAccessible: true,
      location: "Upper Bowl Concourse near Section 325"
    },
    {
      id: "merch-main",
      type: "vendor",
      name: "FIFA Official Superstore",
      offerings: ["jerseys", "scarves", "hats", "mascot plush"],
      isAccessible: true,
      location: "Plaza Level near Pepsi Gate"
    },
    {
      id: "premium-coaches-club",
      type: "amenity",
      name: "Coaches Club",
      offerings: ["vip dining", "bar", "premium seating access"],
      isAccessible: true,
      location: "Mezzanine Level near Section 211"
    },
    {
      id: "restroom-101",
      type: "restroom",
      name: "Restroom - Section 101",
      isAccessible: true,
      location: "Lower Bowl Concourse Section 101"
    },
    {
      id: "medical-1",
      type: "amenity",
      name: "First Aid Station",
      offerings: ["medical assistance", "bandages", "water"],
      isAccessible: true,
      location: "Plaza Level near Bud Light Gate"
    },
    {
      id: "highway-route3",
      type: "logistics",
      name: "Route 3 Highway",
      isAccessible: true,
      details: "Major highway connecting to the stadium's northern perimeter. Access to Lot E and Lot F."
    },
    {
      id: "highway-route120",
      type: "logistics",
      name: "Route 120",
      isAccessible: true,
      details: "Western perimeter access road connecting to the NJ Turnpike."
    },
    {
      id: "highway-nj-turnpike",
      type: "logistics",
      name: "New Jersey Turnpike (I-95)",
      isAccessible: true,
      details: "Main interstate access to MetLife Stadium. Use Exit 16W."
    },
    {
      id: "parking-lot-e",
      type: "logistics",
      name: "Parking Lot E",
      isAccessible: true,
      details: "General parking located on the western side near Verizon Gate."
    },
    {
      id: "parking-lot-f",
      type: "logistics",
      name: "Parking Lot F",
      isAccessible: true,
      details: "General parking located on the northwestern side near Pepsi Gate."
    },
    {
      id: "parking-lot-g",
      type: "logistics",
      name: "Parking Lot G",
      isAccessible: true,
      details: "Premium tailgating lot located on the eastern side near SAP Gate."
    }
  ] as StadiumNode[]
};
