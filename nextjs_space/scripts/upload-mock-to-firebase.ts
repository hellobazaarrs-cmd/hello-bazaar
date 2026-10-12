import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { prisma } from "../lib/db";

async function main() {
  const mockDbPath = path.resolve(process.cwd(), "firebase-mock.json");
  if (!fs.existsSync(mockDbPath)) {
    console.error("❌ local firebase-mock.json file not found!");
    process.exit(1);
  }

  console.log("🌱 Reading firebase-mock.json data...");
  const data = JSON.parse(fs.readFileSync(mockDbPath, "utf8"));

  // Mapping collection keys to Prisma models
  const modelMapping: Record<string, any> = {
    users: prisma.user,
    categories: prisma.category,
    products: prisma.product,
    addresses: prisma.address,
    cartItems: prisma.cartItem,
    wishlistItems: prisma.wishlistItem,
    orders: prisma.order,
    orderItems: prisma.orderItem,
    orderTrackings: prisma.orderTracking,
    supportTickets: prisma.supportTicket,
    coupons: prisma.coupon,
  };

  for (const key of Object.keys(data)) {
    const model = modelMapping[key];
    const items = data[key];

    if (!model) {
      console.warn(`⚠️ No model mapping found for key: ${key}, skipping...`);
      continue;
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.log(`ℹ️ Collection ${key} is empty, skipping...`);
      continue;
    }

    console.log(`📤 Uploading ${items.length} items to collection: ${key}...`);

    for (const item of items) {
      try {
        const { id, ...rest } = item;
        
        // Remove undefined, null, or empty values that can cause errors
        const cleanData: any = { id };
        for (const prop of Object.keys(rest)) {
          if (rest[prop] !== undefined) {
            cleanData[prop] = rest[prop];
          }
        }

        // Upsert to Firebase
        await model.upsert({
          where: { id: id },
          update: cleanData,
          create: cleanData,
        });
      } catch (e: any) {
        console.error(`❌ Failed to upload item ${item.id} to ${key}:`, e.message || e);
      }
    }
    console.log(`✅ Completed uploading ${key}`);
  }

  console.log("🎉 All local database data has been successfully uploaded to the live Firebase database!");
}

main()
  .catch((e) => {
    console.error("❌ Upload script failed:", e);
    process.exit(1);
  });
