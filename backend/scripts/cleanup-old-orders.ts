/**
 * Migration Script: Clean up old Order data
 * 
 * This script removes:
 * 1. Old Order collection (deprecated - replaced by ArtOrder and TicketBooking)
 * 2. Old tickets that reference non-existent TicketBooking records
 * 3. Any orphaned data
 * 
 * Run with: npx ts-node scripts/cleanup-old-orders.ts
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database";

async function cleanup() {
  console.log("🚀 Starting cleanup migration...\n");

  try {
    await connectDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error("Database connection not established");
    }

    // ─────────────────────────────────────────────────────────────
    // Step 1: Check and drop old 'orders' collection
    // ─────────────────────────────────────────────────────────────
    console.log("📦 Step 1: Checking for old 'orders' collection...");
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (collectionNames.includes("orders")) {
      const ordersCollection = db.collection("orders");
      const orderCount = await ordersCollection.countDocuments();
      console.log(`   Found ${orderCount} documents in 'orders' collection`);
      
      if (orderCount > 0) {
        // Backup info before deletion
        console.log("   ⚠️  Dropping old orders collection...");
        await db.dropCollection("orders");
        console.log("   ✅ Old 'orders' collection dropped successfully");
      } else {
        await db.dropCollection("orders");
        console.log("   ✅ Empty 'orders' collection dropped");
      }
    } else {
      console.log("   ℹ️  No 'orders' collection found (already cleaned)");
    }

    // ─────────────────────────────────────────────────────────────
    // Step 2: Clean up orphaned tickets
    // ─────────────────────────────────────────────────────────────
    console.log("\n🎫 Step 2: Checking for orphaned tickets...");
    
    if (collectionNames.includes("tickets")) {
      const ticketsCollection = db.collection("tickets");
      const ticketBookingsCollection = collectionNames.includes("ticketbookings") 
        ? db.collection("ticketbookings") 
        : null;
      
      const totalTickets = await ticketsCollection.countDocuments();
      console.log(`   Found ${totalTickets} total tickets`);
      
      if (ticketBookingsCollection) {
        // Get all valid booking IDs
        const validBookings = await ticketBookingsCollection.find({}, { projection: { _id: 1 } }).toArray();
        const validBookingIds = new Set(validBookings.map(b => b._id.toString()));
        
        // Find tickets with invalid orderId references
        const allTickets = await ticketsCollection.find({}, { projection: { _id: 1, orderId: 1, ticketId: 1 } }).toArray();
        const orphanedTicketIds: mongoose.Types.ObjectId[] = [];
        
        for (const ticket of allTickets) {
          if (ticket.orderId && !validBookingIds.has(ticket.orderId.toString())) {
            orphanedTicketIds.push(ticket._id);
          }
        }
        
        if (orphanedTicketIds.length > 0) {
          console.log(`   ⚠️  Found ${orphanedTicketIds.length} orphaned tickets (referencing old Order model)`);
          console.log("   Deleting orphaned tickets...");
          
          const deleteResult = await ticketsCollection.deleteMany({
            _id: { $in: orphanedTicketIds }
          });
          
          console.log(`   ✅ Deleted ${deleteResult.deletedCount} orphaned tickets`);
        } else {
          console.log("   ✅ No orphaned tickets found");
        }
      } else {
        console.log("   ℹ️  No ticketbookings collection found - skipping orphan check");
      }
    } else {
      console.log("   ℹ️  No tickets collection found");
    }

    // ─────────────────────────────────────────────────────────────
    // Step 3: Show current state
    // ─────────────────────────────────────────────────────────────
    console.log("\n📊 Step 3: Current database state...");
    
    const finalCollections = await db.listCollections().toArray();
    const relevantCollections = ["artorders", "ticketbookings", "tickets", "orders"];
    
    for (const name of relevantCollections) {
      if (finalCollections.find(c => c.name === name)) {
        const count = await db.collection(name).countDocuments();
        console.log(`   ${name}: ${count} documents`);
      } else {
        console.log(`   ${name}: (not found)`);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Step 4: Verify data integrity
    // ─────────────────────────────────────────────────────────────
    console.log("\n🔍 Step 4: Verifying data integrity...");
    
    // Check ArtOrders
    if (finalCollections.find(c => c.name === "artorders")) {
      const artOrdersCollection = db.collection("artorders");
      const paidArtOrders = await artOrdersCollection.countDocuments({ orderStatus: "paid" });
      const pendingArtOrders = await artOrdersCollection.countDocuments({ orderStatus: "created" });
      console.log(`   ArtOrders: ${paidArtOrders} paid, ${pendingArtOrders} pending`);
    }
    
    // Check TicketBookings
    if (finalCollections.find(c => c.name === "ticketbookings")) {
      const bookingsCollection = db.collection("ticketbookings");
      const paidBookings = await bookingsCollection.countDocuments({ bookingStatus: "paid" });
      const pendingBookings = await bookingsCollection.countDocuments({ bookingStatus: "created" });
      console.log(`   TicketBookings: ${paidBookings} paid, ${pendingBookings} pending`);
    }
    
    // Check Tickets
    if (finalCollections.find(c => c.name === "tickets")) {
      const ticketsCollection = db.collection("tickets");
      const activeTickets = await ticketsCollection.countDocuments({ status: "active" });
      const usedTickets = await ticketsCollection.countDocuments({ status: "used" });
      console.log(`   Tickets: ${activeTickets} active, ${usedTickets} used`);
    }

    console.log("\n✅ Cleanup migration completed successfully!");
    console.log("\n📝 Summary:");
    console.log("   - Old 'orders' collection has been removed");
    console.log("   - Orphaned tickets have been cleaned up");
    console.log("   - New models (ArtOrder, TicketBooking) are now the source of truth");
    console.log("\n💡 The website should now work properly with the new data models.");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database connection closed.");
    process.exit(0);
  }
}

// Run the cleanup
cleanup();
